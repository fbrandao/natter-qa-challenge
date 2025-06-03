import type { Page } from '@playwright/test';
import { defaultLogger } from '../logger';

export interface MediaHealthCheck {
  name: string;
  check: (page: Page) => Promise<boolean>;
}

export class HealthCheckRegistry {
  private checks: MediaHealthCheck[] = [];
  private logger = defaultLogger.withContext('HealthCheck');

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
  const logger = defaultLogger.withContext('HealthCheck');
  logger.header('Running media device health checks');

  for (const check of healthChecks.getChecks()) {
    try {
      logger.debug(`Checking ${check.name}...`);
      const isHealthy = await check.check(page);

      if (!isHealthy) {
        throw new Error(`${check.name} check failed`);
      }
      logger.info(`${check.name} is healthy!`);
    } catch (error) {
      logger.error(`${check.name} health check failed:`, error);
      throw error;
    }
  }
}
