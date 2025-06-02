import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env';
import os from 'os';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!config.env.isCI,
  retries: config.env.isCI ? 1 : 0,
  workers: 1,
  snapshotDir: config.env.isCI ? './snapshots/ci' : './snapshots/local',
  expect: {
    timeout: config.env.isCI ? 10000 : 5000,
    toHaveScreenshot: {
      pathTemplate: `snapshots/${config.env.environment}/{testFilePath}/{arg}-{platform}{ext}`,
    },
  },
  reporter: config.env.isCI
    ? [
        ['html', { outputFolder: `./reports/e2e`, open: 'never' }],
        ['line'],
        ['junit', { outputFile: `./reports/e2e/results.xml` }],
        ['json', { outputFile: `./reports/e2e/results.json` }],
        ['github'],
        [
          'playwright-ctrf-json-reporter',
          {
            outputFile: 'ctrf/reports/e2e/ctrf.json',
            appName: 'Natter QA Challenge',
            appVersion: '1.0.0',
            osPlatform: os.platform(),
            osRelease: os.release(),
            osVersion: os.version(),
            buildName: 'Natter E2E Build',
            buildNumber: process.env.GITHUB_RUN_NUMBER || '1',
            testEnvironment: process.env.NODE_ENV || 'development',
          },
        ],
      ]
    : [['html', { outputFolder: `./reports/e2e`, open: 'on-failure' }], ['line']],

  globalSetup: './global-setup.ts',

  use: {
    trace: 'on',
  },
  projects: [
    {
      name: 'single-user',
      testMatch: /single-users\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
        baseURL: 'https://webdemo.agora.io/basicVideoCall/index.html',
        headless: false,
      },
    },
    {
      name: 'multi-user',
      testMatch: /multi-user\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
        baseURL: 'https://webdemo.agora.io/basicVideoCall/index.html',
        headless: false,
      },
    },
    {
      name: 'snapshot-users',
      testMatch: /snapshot-users\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
        baseURL: 'https://webdemo.agora.io/basicVideoCall/index.html',
        headless: false,
      },
    },
  ],
});
