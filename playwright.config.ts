import { defineConfig, devices } from '@playwright/test';
import { isCI, testPaths } from './config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: isCI
    ? [
        ['html', { outputFolder: `./reports/e2e` }],
        ['line'],
        ['junit', { outputFile: `./reports/e2e/results.xml` }],
        ['json', { outputFile: `./reports/e2e/results.json` }],
        ['github']       
      ]
    : [['html', { outputFolder: `./reports/e2e` }], ['line']],
  globalSetup: './global-setup.ts',

  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
        baseURL: 'https://webdemo.agora.io/basicVideoCall/index.html',
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            `--use-file-for-fake-video-capture=${testPaths.videos}`,
          ],
        },
        headless: false,
      },
    },
  ],
});
