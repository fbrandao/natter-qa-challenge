import { test as pageFixtures } from './pageFixtures';
import { test as sessionFixtures } from './sessionFixtures';
import { test as userFixtures } from './userFixtures';
import { mergeTests, expect as baseExpect } from '@playwright/test';
import { runHealthChecks } from '../utils/healthCheck/healthCheck';
import './healthChecks';
import { defaultLogger } from '../utils/logger';

const logger = defaultLogger.withContext('TestFixtures');

export const test = mergeTests(pageFixtures, sessionFixtures, userFixtures);

// Add global beforeEach hook for health checks
test.beforeEach(async ({ page }, testInfo) => {
  logger.header(`Starting test: ${testInfo.title}`);
  
  await test.step('Run media device health checks', async () => {
    await runHealthChecks(page);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  logger.info(`Completed test: ${testInfo.title}`);
  logger.debug(`Test duration: ${testInfo.duration}ms`);
  logger.debug(`Test status: ${testInfo.status}`);
});

export { baseExpect as expect };
