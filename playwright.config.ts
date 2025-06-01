import { defineConfig, devices } from '@playwright/test';
import { isCI } from './config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: isCI
    ? [
        ['html', { outputFolder: `./reports/e2e` }],
        ['line'],
        ['junit', { outputFile: `./reports/e2e/results.xml` }],
        ['json', { outputFile: `./reports/e2e/results.json` }],
        ['github'],
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
  ],
});
