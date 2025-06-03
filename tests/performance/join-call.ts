import { Page } from '@playwright/test';
import { VideoCallPage } from '../../pages/basicVideo/videCallPage';
import * as path from 'path';
import * as fs from 'fs';
import { config as appConfig } from '../../config/performance';
import { defaultLogger } from '../../utils/logger';

const logger = defaultLogger.withContext('PerformanceTest');

const videoFile = path.join(appConfig.paths.videos, 'randomUsers/silent_qcif.y4m');
if (!fs.existsSync(videoFile)) {
  logger.error(`Video file not found: ${videoFile}`);
  throw new Error(`Video file not found: ${videoFile}`);
}

export const config = {
  target: 'https://webdemo.agora.io/basicVideoCall/index.html',
  plugins: {
    '@artilleryio/playwright-reporter': {
      name: 'Natter QA Challenge'
    },
    ensure: {
      thresholds: {
        'webrtc.user.joined': 0.95,
        'webrtc.local_video.success': 0.95,
        'webrtc.error': 0.05
      }
    }
  },
  engines: {
    playwright: {
      launchOptions: {
        headless: true,
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          '--disable-gpu',
          `--use-file-for-fake-video-capture=${videoFile}`
        ]
      },
      timeout: 30000,
      expect: { timeout: 10000 }
    }
  },
  phases: [
    { duration: 10, arrivalRate: 1, name: 'Warm up' },
    { duration: 10, arrivalRate: 2, name: 'Load' },
    { duration: 10, arrivalRate: 5, name: 'Ramp up' },
    { duration: 10, arrivalRate: 10, name: 'Heavy Load' },
    { duration: 5, arrivalRate: 15, name: 'Spike' },
    { duration: 10, arrivalRate: 2, name: 'Recovery' }
  ],
  metrics: {
    '✅ WebRTC - User Successfully Joined Call': 'counter',
    '🎥 WebRTC - Local Video Playback Success': 'counter',
    '❌ WebRTC - Errors Encountered': 'counter'
  }
  
};

export const scenarios = [
  {
    name: 'Join and Leave WebRTC Call',
    engine: 'playwright',
    testFunction: joinCallFlow
  }
];

async function joinCallFlow(page: Page, vuContext: any, events: any, test: { step: (name: string, fn: () => Promise<void>) => Promise<void> }) {
  const videoCallPage = new VideoCallPage(page);
  const userId = `test-user-${vuContext.vuId}`;

  try {
    await test.step('Join call and verify video', async () => {
      await page.context().grantPermissions(['camera', 'microphone']);
      
      await videoCallPage.navigateAndJoin(
        appConfig.auth.agora.appId,
        appConfig.auth.agora.token,
        appConfig.auth.agora.channel,
        userId
      );
      
      await videoCallPage.expectSuccessAlert();
      events.emit('counter', 'webrtc.user.joined', 1);
      
      await videoCallPage.expectLocalVideoPlaying(1);
      events.emit('counter', 'webrtc.local_video.success', 1);
    });

    await test.step('Leave call', async () => {
      await videoCallPage.leaveCall();
      await videoCallPage.expectNoLocalVideoPlaying();
    });

  } catch (error) {
    logger.error('Test failed:', error);
    await page.screenshot({ 
      path: path.join(appConfig.paths.reports, `error-${userId}.png`),
      fullPage: true 
    });
    events.emit('counter', 'webrtc.error', 1);
    throw error;
  }
}
