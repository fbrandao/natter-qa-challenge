import { test as pageFixtures } from './pageFixtures';
import { test as sessionFixtures } from './sessionFixtures';
import { mergeTests, expect as baseExpect } from '@playwright/test';
import { runHealthChecks } from '../utils/healthCheck/healthCheck';
import './healthChecks';

export const test = mergeTests(pageFixtures, sessionFixtures);

// Add global beforeEach hook for health checks
test.beforeEach(async ({ page }) => {
  await test.step('Run media device health checks', async () => {
    await runHealthChecks(page);
  });
});

export { baseExpect as expect };
