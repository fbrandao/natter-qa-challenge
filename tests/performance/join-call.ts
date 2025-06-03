import { Page } from '@playwright/test';
import { VideoCallPage } from '../../pages/basicVideo/videCallPage';
import { faker } from '@faker-js/faker';
import * as path from 'path';
import * as fs from 'fs';
import { config as appConfig } from '../../config/performance';
import { defaultLogger } from '../../utils/logger';

const logger = defaultLogger.withContext('PerformanceTest');

// Create reports directory if it doesn't exist
const reportsDir = path.join(appConfig.paths.reports);
if (!fs.existsSync(reportsDir)) {
  logger.debug('Creating reports directory...');
  fs.mkdirSync(reportsDir, { recursive: true });
} else {
  logger.debug('Reports directory already exists');
}

// Setup video file
const videoFiles = [
  'randomUsers/salesman_qcif.y4m',
  'randomUsers/sign_irene_qcif.y4m',
  'randomUsers/silent_qcif.y4m',
  'randomUsers/suzie_qcif.y4m',
].map(file => path.join(appConfig.paths.videos, file));

const selectedVideoFile = faker.helpers.arrayElement(videoFiles);
if (!fs.existsSync(selectedVideoFile)) {
  logger.error(`Video file not found: ${selectedVideoFile}`);
  throw new Error(`Video file not found: ${selectedVideoFile}`);
}

export const config = {
  target: 'https://webdemo.agora.io/basicVideoCall/index.html',
  plugins: {
    '@artilleryio/playwright-reporter': {
      name: 'Natter QA Challenge'
    },
    ensure: {
      thresholds: {
        'http.response_time.p95': 5000,
        'http.response_time.p99': 8000,
        'webrtc.user.joined': 0.95,
        'webrtc.local_video.success': 0.95,
        'webrtc.error': 0.05
      },
      conditions: [
        {
          expression: 'webrtc.user.joined >= 0.95 and webrtc.local_video.success >= 0.95',
          strict: true
        },
        {
          expression: 'webrtc.error <= 0.05',
          strict: true
        }
      ]
    }
  },
  engines: {
    playwright: {
      trace: true,
      launchOptions: {
        headless: false,
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          '--disable-gpu',
          `--use-file-for-fake-video-capture=${selectedVideoFile}`
        ]
      },
      timeout: 60000,
      navigationTimeout: 60000,
      actionTimeout: 30000,
      expect: { timeout: 15000 }
    }
  },
  phases: [
    { duration: 20, arrivalRate: 1, name: 'Warm up phase' },
    { duration: 20, arrivalRate: 2, name: 'Sustained load phase' },
    { duration: 20, arrivalRate: 1, name: 'Cool down phase' }
  ],
  extendedMetrics: true,
  metrics: {
    'webrtc.user.joined': 'counter',
    'webrtc.local_video.success': 'counter',
    'webrtc.local_video.failed': 'counter',
    'webrtc.user.left': 'counter',
    'webrtc.error': 'counter',
    'webrtc.join.time': 'histogram',
    'webrtc.video.start.time': 'histogram'
  }
};

export const scenarios = [
  {
    name: 'Join and Leave WebRTC Call - Normal Flow',
    engine: 'playwright',
    testFunction: joinCallFlow,
    weight: 7
  },
  {
    name: 'Join and Leave WebRTC Call - Quick Exit',
    engine: 'playwright',
    testFunction: quickExitFlow,
    weight: 3
  }
];

async function joinCallFlow(page: Page, vuContext: any, events: any, test: { step: (name: string, fn: () => Promise<void>) => Promise<void> }) {
  const flowLogger = logger.withContext('JoinCallFlow');
  flowLogger.header('Starting normal flow');
  
  const videoCallPage = new VideoCallPage(page);
  const userId = faker.number.int({ min: 10000, max: 99999 }).toString();
  flowLogger.info(`User ID: ${userId}`);

  try {
    await test.step('Join call and verify video', async () => {
      // Setup permissions
      await page.context().grantPermissions(['camera', 'microphone']);
      
      // Join call
      await videoCallPage.navigateAndJoin(
        appConfig.auth.agora.appId,
        appConfig.auth.agora.token,
        appConfig.auth.agora.channel,
        userId
      );
      
      // Verify join success
      await videoCallPage.expectSuccessAlert();
      events.emit('counter', 'webrtc.user.joined', 1);
      
      // Verify video
      await page.waitForTimeout(2000); // Allow video to initialize
      await videoCallPage.expectLocalVideoPlaying(1);
      events.emit('counter', 'webrtc.local_video.success', 1);
    });

    await test.step('Leave call', async () => {
      await videoCallPage.leaveCall();
      await videoCallPage.expectNoLocalVideoPlaying();
      events.emit('counter', 'webrtc.user.left', 1);
    });

  } catch (error) {
    flowLogger.error('Flow failed:', error);
    await page.screenshot({ path: path.join(appConfig.paths.reports, `error-${userId}.png`) });
    events.emit('counter', 'webrtc.error', 1);
    throw error;
  }
}

async function quickExitFlow(page: Page, vuContext: any, events: any, test: { step: (name: string, fn: () => Promise<void>) => Promise<void> }) {
  const flowLogger = logger.withContext('QuickExitFlow');
  flowLogger.header('Starting quick exit flow');
  
  const videoCallPage = new VideoCallPage(page);
  const userId = faker.number.int({ min: 10000, max: 99999 }).toString();
  const startTime = Date.now();

  try {
    await test.step('Quick join and exit', async () => {
      await page.context().grantPermissions(['camera', 'microphone']);
      
      await videoCallPage.navigateAndJoin(
        appConfig.auth.agora.appId,
        appConfig.auth.agora.token,
        appConfig.auth.agora.channel,
        userId
      );
      
      await videoCallPage.expectSuccessAlert();
      events.emit('counter', 'webrtc.user.joined', 1);
      events.emit('histogram', 'webrtc.join.time', Date.now() - startTime);
      
      await videoCallPage.leaveCall();
      events.emit('counter', 'webrtc.user.left', 1);
    });
  } catch (error) {
    flowLogger.error('Quick exit failed:', error);
    events.emit('counter', 'webrtc.error', 1);
    throw error;
  }
}
