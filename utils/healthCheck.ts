import type { Page } from '@playwright/test';

export interface MediaHealthCheck {
  name: string;
  check: (page: Page) => Promise<boolean>;
}

export class HealthCheckRegistry {
  private checks: MediaHealthCheck[] = [];

  add(check: MediaHealthCheck) {
    this.checks.push(check);
    return this;
  }

  getChecks() {
    return this.checks;
  }
}

export const healthChecks = new HealthCheckRegistry();

export async function runHealthChecks(page: Page) {
  console.log('Running media device health checks...');

  for (const check of healthChecks.getChecks()) {
    try {
      console.log(`Checking ${check.name}...`);
      const isHealthy = await check.check(page);
      
      if (!isHealthy) {
        throw new Error(`${check.name} check failed`);
      }
      console.log(`${check.name} is healthy!`);
    } catch (error) {
      console.error(`${check.name} health check failed:`, error);
      throw error;
    }
  }
} 