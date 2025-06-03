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

// Define video files directly - using correct path from project root
const videoFiles = [
  path.join(appConfig.paths.videos, 'randomUsers/salesman_qcif.y4m'),
  path.join(appConfig.paths.videos, 'randomUsers/sign_irene_qcif.y4m'),
  path.join(appConfig.paths.videos, 'randomUsers/silent_qcif.y4m'),
  path.join(appConfig.paths.videos, 'randomUsers/suzie_qcif.y4m'),
];

// Verify video files exist
const selectedVideoFile = faker.helpers.arrayElement(videoFiles);
logger.debug('Selected video file:', selectedVideoFile);
if (!fs.existsSync(selectedVideoFile)) {
  logger.error(`Video file not found: ${selectedVideoFile}`);
  throw new Error(`Video file not found: ${selectedVideoFile}`);
}
logger.info('Video file exists and is accessible');

export const config = {
  target: 'https://webdemo.agora.io/basicVideoCall/index.html',
  plugins: {
    '@artilleryio/playwright-reporter': {
      name: 'Natter QA Challenge'
    },
    ensure: {
      thresholds: {
        // Response time thresholds
        'http.response_time.p95': 5000,  // 5 seconds max for p95
        'http.response_time.p99': 8000,  // 8 seconds max for p99
        // Custom metrics thresholds
        'webrtc.user.joined': 0.95,      // 95% success rate for joining
        'webrtc.local_video.success': 0.95, // 95% success rate for video
        'webrtc.error': 0.05             // Max 5% error rate
      },
      conditions: [
        // Ensure we maintain good performance under load
        {
          expression: 'webrtc.user.joined >= 0.95 and webrtc.local_video.success >= 0.95',
          strict: true
        },
        // Check that error rate stays low
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
      timeout: 60000, // 60 seconds
      navigationTimeout: 60000, // 60 seconds
      actionTimeout: 30000 // 30 seconds
    }
  },
  phases: [
    // Warm-up phase
    {
      duration: 20,
      arrivalRate: 1,
      name: 'Warm up phase'
    },
    // Sustained load phase
    {
      duration: 20,
      arrivalRate: 2,
      name: 'Sustained load phase'
    },
    // Cool-down phase
    {
      duration: 20,
      arrivalRate: 1,
      name: 'Cool down phase'
    }
  ],
  extendedMetrics: true,
  // Add custom metrics
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

async function joinCallFlow(
  page: Page,
  vuContext: any,
  events: any,
  test: { step: (name: string, fn: () => Promise<void>) => Promise<void> }
) {
  const { step } = test;
  const flowLogger = logger.withContext('JoinCallFlow');
  flowLogger.header('Starting new virtual user flow');
  
  // Set up browser context with permissions
  flowLogger.debug('Granting browser permissions...');
  await page.context().grantPermissions(['camera', 'microphone']);
  flowLogger.debug('Browser permissions granted');
  
  const videoCallPage = new VideoCallPage(page);
  const userId = faker.number.int({ min: 10000, max: 99999 }).toString();
  flowLogger.info(`Generated user ID: ${userId}`);

  try {
    await step('Navigate and join call', async () => {
      flowLogger.debug('Attempting to join call...');
      flowLogger.debug('Using video file:', selectedVideoFile);
      
      await videoCallPage.navigateAndJoin(
        appConfig.auth.agora.appId,
        appConfig.auth.agora.token,
        appConfig.auth.agora.channel,
        userId
      );
      
      // Wait for success alert with increased timeout
      flowLogger.debug('Waiting for join success alert...');
      try {
        await videoCallPage.expectSuccessAlert();
        flowLogger.info('Successfully joined call');
        events.emit('counter', 'webrtc.user.joined', 1);
      } catch (error) {
        flowLogger.error('Failed to see success alert:', error);
        // Take a screenshot for debugging
        await page.screenshot({ path: path.join(reportsDir, `join-failed-${userId}.png`) });
        throw error;
      }
    });

    await step('Verify local video started', async () => {
      flowLogger.debug('Checking local video...');
      try {
        // Add a small delay to ensure video has time to start
        flowLogger.debug('Waiting for video to initialize...');
        await page.waitForTimeout(2000);
        
        // Check if video element exists
        const videoElement = await page.locator('video').first();
        const isVisible = await videoElement.isVisible();
        flowLogger.debug('Video element visible:', isVisible);
        
        await videoCallPage.expectLocalVideoPlaying(1);
        flowLogger.info('Local video is playing');
        events.emit('counter', 'webrtc.local_video.success', 1);
      } catch (error) {
        flowLogger.error('Local video failed:', error);
        // Take a screenshot for debugging
        await page.screenshot({ path: path.join(reportsDir, `video-failed-${userId}.png`) });
        events.emit('counter', 'webrtc.local_video.failed', 1);
        throw error;
      }
    });

    await step('Leave the call', async () => {
      flowLogger.debug('Leaving call...');
      await videoCallPage.leaveCall();
      await videoCallPage.expectNoLocalVideoPlaying();
      flowLogger.info('Successfully left call');
      events.emit('counter', 'webrtc.user.left', 1);
    });

  } catch (error) {
    flowLogger.error('Error in virtual user flow:', error);
    events.emit('counter', 'webrtc.error', 1);
    throw error;
  }
}

async function quickExitFlow(
  page: Page,
  vuContext: any,
  events: any,
  test: { step: (name: string, fn: () => Promise<void>) => Promise<void> }
) {
  const { step } = test;
  const flowLogger = logger.withContext('QuickExitFlow');
  flowLogger.header('Starting quick exit flow');
  
  await page.context().grantPermissions(['camera', 'microphone']);
  
  const videoCallPage = new VideoCallPage(page);
  const userId = faker.number.int({ min: 10000, max: 99999 }).toString();
  const startTime = Date.now();
  flowLogger.debug(`Generated user ID: ${userId}`);

  try {
    await step('Quick join and leave', async () => {
      flowLogger.debug('Attempting quick join...');
      await videoCallPage.navigateAndJoin(
        appConfig.auth.agora.appId,
        appConfig.auth.agora.token,
        appConfig.auth.agora.channel,
        userId
      );
      
      await videoCallPage.expectSuccessAlert();
      flowLogger.info('Successfully joined call');
      events.emit('counter', 'webrtc.user.joined', 1);
      
      // Record join time
      const joinTime = Date.now() - startTime;
      flowLogger.debug(`Join time: ${joinTime}ms`);
      events.emit('histogram', 'webrtc.join.time', joinTime);
      
      // Quick exit without waiting for video
      flowLogger.debug('Performing quick exit...');
      await videoCallPage.leaveCall();
      flowLogger.info('Successfully left call');
      events.emit('counter', 'webrtc.user.left', 1);
    });
  } catch (error) {
    flowLogger.error('Error in quick exit flow:', error);
    events.emit('counter', 'webrtc.error', 1);
    throw error;
  }
}
