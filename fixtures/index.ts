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
  logger.header(`Starting Test: ${testInfo.title}`);
  logger.info(`Test File: ${testInfo.file}`);
  logger.info(`Test Line: ${testInfo.line}`);
  
  await test.step('Run media device health checks', async () => {
    await runHealthChecks(page);
  });
});

test.afterEach(async (_, testInfo) => {
  const status = testInfo.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
  logger.header(`Test Complete: ${testInfo.title}`);
  logger.info(`Status: ${status}`);
  logger.info(`Duration: ${testInfo.duration}ms`);
});

export { baseExpect as expect };
