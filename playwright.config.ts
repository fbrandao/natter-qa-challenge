import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the root directory path
const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);

// Ensure CTRF report directory exists at project root
const ctrfReportDir = path.join(process.cwd(), 'ctrf', 'reports', 'e2e');
if (!fs.existsSync(ctrfReportDir)) {
  console.log('Creating CTRF report directory:', ctrfReportDir);
  fs.mkdirSync(ctrfReportDir, { recursive: true });
}

// Define CTRF report file path at project root
const ctrfReportFile = path.join(ctrfReportDir, 'ctrf.json');
console.log('CTRF report will be written to:', ctrfReportFile);

export default defineConfig({
  testDir: path.join(rootDir, 'tests/functional/e2e'),
  timeout: config.env.isCI ? 60000 : 30000,
  fullyParallel: false,
  forbidOnly: !!config.env.isCI,
  retries: config.env.isCI ? 1 : 0,
  workers: 1,
  snapshotDir: config.env.isCI 
    ? path.join(rootDir, 'snapshots/ci') 
    : path.join(rootDir, 'snapshots/local'),
  expect: {
    timeout: config.env.isCI ? 10000 : 5000,
    toHaveScreenshot: {
      pathTemplate: path.join(rootDir, 'snapshots', config.env.environment, '{testFilePath}', '{arg}-{platform}{ext}'),
    },
  },
  reporter: !config.env.isCI
    ? [
        ['html', { outputFolder: path.join(rootDir, 'reports/e2e'), open: 'never' }],
        ['line'],
        ['junit', { outputFile: path.join(rootDir, 'reports/e2e/results.xml') }],
        ['json', { outputFile: path.join(rootDir, 'reports/e2e/results.json') }],
        ['github'],
        [
          'playwright-ctrf-json-reporter',
          {
            outputFile: ctrfReportFile,
            appName: 'Natter QA Challenge',
            appVersion: '1.0.0',
            osPlatform: os.platform(),
            osRelease: os.release(),
            osVersion: os.version(),
            buildName: 'Natter E2E Build',
            buildNumber: process.env.GITHUB_RUN_NUMBER || '1',
            testEnvironment: process.env.NODE_ENV || 'development',
            debug: true
          },
        ],
      ]
    : [
        ['html', { outputFolder: path.join(rootDir, 'reports/e2e'), open: 'on-failure' }], 
        ['line']
      ],

  globalSetup: path.join(rootDir, 'global-setup.ts'),

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
