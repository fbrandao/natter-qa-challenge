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
  logger.testStart(`Starting Test: ${testInfo.title}`);
  logger.info(`Test File: ${testInfo.file}`);
  
  await test.step('Setup', async () => {
    await runHealthChecks(page);
  });
});

test.afterEach(async ({ }, testInfo) => {
  const status = testInfo.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
  logger.testEnd(`Test Complete: ${testInfo.title}`);
  logger.info(`Status: ${status}`);
  logger.info(`Duration: ${testInfo.duration}ms`);
});

export { baseExpect as expect };
