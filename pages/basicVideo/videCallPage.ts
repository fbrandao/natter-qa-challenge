import { Locator, Page, expect, Response } from '@playwright/test';
import { BasePage } from '../base/basePage';
import { User } from '../../utils/session/types';
import { defaultLogger } from '../../utils/logger';

interface ApiRequest {
  method: string;
  url: string | RegExp;
}

export class VideoCallPage extends BasePage {
  private logger = defaultLogger.withContext('VideoCallPage');

  readonly appIdInput: Locator = this.page.getByRole('textbox', { name: 'Enter the appid' });
  readonly tokenInput: Locator = this.page.getByRole('textbox', { name: 'Enter the app token' });
  readonly channelInput: Locator = this.page.getByRole('textbox', {
    name: 'Enter the channel name',
  });
  readonly userIdInput: Locator = this.page.getByRole('textbox', { name: 'Enter the user ID' });
  readonly joinButton: Locator = this.page.getByRole('button', { name: 'Join' });
  readonly leaveButton: Locator = this.page.getByRole('button', { name: 'Leave' });
  readonly advanceSettingsButton: Locator = this.page.getByRole('button', {
    name: 'ADVANCED SETTINGS',
  });

  // Selectors for video elements
  readonly remoteVideoContainer: Locator = this.page.locator(
    '#remote-playerlist .agora_video_player'
  );
  readonly localVideoContainer: Locator = this.page.locator('#local-player .agora_video_player');

  readonly videoGrid: Locator = this.page.locator('.video-group');
  readonly successAlertToast: Locator = this.page
    .getByRole('alert')
    .getByText('Joined room successfully.');

  constructor(page: Page) {
    super(page);
  }

  private async waitForActionAndApiResponses(options: {
    requests: ApiRequest[];
    action: () => Promise<void>;
  }): Promise<Response[]> {
    const { requests, action } = options;

    const responsePromises = requests.map((request) =>
      this.page.waitForResponse((resp) => {
        const matchesUrl =
          typeof request.url === 'string'
            ? resp.url().includes(request.url)
            : request.url.test(resp.url());
        return matchesUrl && resp.request().method().toUpperCase() === request.method.toUpperCase();
      })
    );

    const [responses] = await Promise.all([Promise.all(responsePromises), action()]);

    return responses;
  }

  async expectSuccessAlert() {
    await expect(this.successAlertToast).toBeVisible();
    await expect(this.successAlertToast).toContainText('Joined room successfully');
  }

  async navigateAndJoin(appId: string, token: string, channel: string, userId?: string) {
    this.logger.debug('Navigating to video call page');
    await this.goto('');
    await this.appIdInput.fill(appId);
    await this.tokenInput.fill(token);
    await this.channelInput.fill(channel);
    if (userId) await this.userIdInput.fill(userId);

    this.logger.debug('Joining call and waiting for API response');
    await this.waitForActionAndApiResponses({
      requests: [
        {
          method: 'POST',
          url: 'webrtc2-ap-web-1.agora.io/api/v2/transpond/webrtc',
        },
      ],
      action: () => this.joinButton.click(),
    });
  }

  async leaveCall() {
    if (await this.leaveButton.isVisible()) {
      this.logger.debug('Leaving call');
      await this.leaveButton.click();
      this.logger.debug('Waiting for local video to hide');
      await this.localVideoContainer.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * Private helper to check if a single video element is considered "playing".
   * @param videoLocator The Locator for the video element.
   */
  private async isVideoPlaying(videoLocator: Locator): Promise<boolean> {
    const videoState = await videoLocator.evaluate((el: HTMLVideoElement) => {
      const isVisible =
        el.offsetParent !== null && !el.hidden && getComputedStyle(el).display !== 'none';
      const readyState = el.readyState;
      const videoWidth = el.videoWidth;
      const videoHeight = el.videoHeight;
      const isPaused = el.paused;

      return {
        elementId: el.id || el.className || 'N/A',
        isVisible,
        readyState,
        dimensions: `${videoWidth}x${videoHeight}`,
        isPaused
      };
    });

    this.logger.debug('Video state check', videoState);

    return (
      videoState.isVisible &&
      (videoState.readyState === 4 || videoState.readyState === 3) &&
      videoState.dimensions !== '0x0' &&
      !videoState.isPaused
    );
  }

  /**
   * Asserts that the specified number of video elements are visible,
   * have enough data to play, and have valid dimensions.
   * @param locator The Locator for the video containers (e.g., localVideoContainer, remoteVideoContainer).
   * @param expectedCount The expected number of video elements.
   * @param timeout The maximum time to wait for the assertion to pass (default: 15000ms).
   */
  async expectVideosPlaying(locator: Locator, expectedCount: number, timeout: number = 15000) {
    this.logger.debug(`Expecting ${expectedCount} videos to be playing`);
    await expect(async () => {
      const videos = await locator.all();
      expect(videos.length).toBe(expectedCount);
      for (const video of videos) {
        expect(await this.isVideoPlaying(video)).toBeTruthy();
      }
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
  }

  /**
   * Asserts that the specified number of local video elements are visible,
   * have enough data to play, and have valid dimensions.
   * @param count The expected number of local video elements.
   * @param timeout The maximum time to wait for the assertion to pass (default: 15000ms).
   */
  async expectLocalVideoPlaying(count: number, timeout: number = 15000) {
    this.logger.debug(`Expecting ${count} local videos to be playing`);
    await this.expectVideosPlaying(this.localVideoContainer, count, timeout);
  }

  /**
   * Asserts that the specified number of remote video elements are visible,
   * have enough data to play, and have valid dimensions.
   * Note: This counts all remote videos. For specific users, use expectRemoteUserVideoPlaying.
   * @param count The expected number of remote video elements.
   * @param timeout The maximum time to wait for the assertion to pass (default: 15000ms).
   */
  async expectRemoteVideosPlaying(count: number, timeout: number = 15000) {
    this.logger.debug(`Expecting ${count} remote videos to be playing`);
    await this.expectVideosPlaying(this.remoteVideoContainer, count, timeout);
  }

  /**
   * Asserts that no video elements (local or remote) are visible or playing based on the provided locator.
   * This is used after leaving the call or when no users are expected.
   * @param locator The Locator for the video containers (e.g., localVideoContainer, remoteVideoContainer).
   * @param timeout The maximum time to wait for the assertion to pass (default: 10000ms).
   */
  private async expectNoVideosPlaying(locator: Locator, timeout: number = 10000) {
    this.logger.debug('Checking for absence of playing videos');
    await expect(async () => {
      const videos = await locator.all();
      if (videos.length === 0) {
        this.logger.debug('No video elements found, as expected');
        return;
      }

      let anyVideoPlaying = false;
      for (const video of videos) {
        if (await this.isVideoPlaying(video)) {
          anyVideoPlaying = true;
          break;
        }
      }
      expect(anyVideoPlaying).toBeFalsy();
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
  }

  /**
   * Asserts that no local video elements are visible or playing.
   * This is used after leaving the call.
   * @param timeout The maximum time to wait for the assertion to pass (default: 10000ms).
   */
  async expectNoLocalVideoPlaying(timeout: number = 10000) {
    this.logger.debug('Checking for absence of local video');
    await this.expectNoVideosPlaying(this.localVideoContainer, timeout);
  }

  /**
   * Asserts that no remote video elements are visible or playing.
   * This is used after leaving the call or when no remote users are expected.
   * @param timeout The maximum time to wait for the assertion to pass (default: 10000ms).
   */
  async expectNoRemoteVideoPlaying(timeout: number = 10000) {
    this.logger.debug('Checking for absence of remote videos');
    await this.expectNoVideosPlaying(this.remoteVideoContainer, timeout);
  }

  /**
   * Get a remote video element by user ID.
   * @param userId The user ID to find the video for.
   * @returns A Locator for the video element.
   */
  getRemoteVideoByUserId(userId: number): Locator {
    // This locator targets the video element directly within the player-wrapper div for the specific user ID.
    return this.page.locator(`#player-wrapper-${userId} .agora_video_player`);
  }

  /**
   * Asserts that a specific remote user's video is visible and playing.
   * @param userId The ID of the remote user.
   * @param timeout The maximum time to wait.
   */
  async expectRemoteUserVideoPlaying(user: User, timeout: number = 15000) {
    const userVideo = this.getRemoteVideoByUserId(user.userId);
    this.logger.debug(`Checking remote video for user ${user.userId}`);
    
    await expect(async () => {
      expect(await this.isVideoPlaying(userVideo)).toBeTruthy();
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
    
    this.logger.info(`Remote video for user ${user.userId} is playing`);
  }

  /**
   * Asserts that a specific remote user's video is NOT visible or playing.
   * @param userId The ID of the remote user.
   * @param timeout The maximum time to wait.
   */
  async expectNoRemoteUserVideoPlaying(user: User, timeout: number = 10000) {
    const userVideo = this.getRemoteVideoByUserId(user.userId);
    const errorMessage = `Remote video for user ID ${user.userId} is still visible/playing after ${timeout}ms`;

    this.logger.debug(`Checking absence of remote video for user ${user.userId}`);
    
    await expect(async () => {
      const isVisible = await userVideo.isVisible();
      expect(isVisible, errorMessage).toBeFalsy();
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
    
    this.logger.info(`Remote video for user ${user.userId} is not playing`);
  }

  /**
   * Get all active remote user IDs displayed on the page.
   * @returns An array of user IDs.
   */
  async getActiveRemoteUserIds(): Promise<string[]> {
    return this.page.evaluate(() => {
      const wrappers = document.querySelectorAll('#remote-playerlist > div[id^="player-wrapper-"]');
      return Array.from(wrappers).map((div) => div.id.replace('player-wrapper-', ''));
    });
  }

  async getActiveLocalUserIds(): Promise<string[]> {
    return this.page.evaluate(() => {
      const localUser = document.querySelector('#local-player');
      return localUser ? [localUser.id.replace('player-wrapper-', '')] : [];
    });
  }

  /**
   * Snapshot only the local and remote player containers for visual comparison.
   * This avoids capturing unrelated UI (like the sidebar or extra content).
   * @param label Optional label to customize snapshot file name.
   */
  async snapshotVideoGrid(label?: string) {
    const remoteUserIds = await this.getActiveRemoteUserIds();
    const snapshotName = label ? `video-grid-${label}.png` : `video-grid-snapshot.png`;

    this.logger.debug('Starting snapshot process', {
      snapshotName,
      remoteUserCount: remoteUserIds.length,
      remoteUserIds
    });

    if (remoteUserIds.length === 0) {
      this.logger.debug('Taking single user snapshot of local video');
      await expect(this.localVideoContainer).toHaveScreenshot(snapshotName, {
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        maxDiffPixelRatio: 0.2,
        threshold: 0.3,
        timeout: 10000,
      });
    } else {
      this.logger.debug('Taking multi-user snapshot of video grid');
      await expect(this.videoGrid).toHaveScreenshot(snapshotName, {
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        maxDiffPixelRatio: 0.2,
        threshold: 0.3,
        timeout: 10000,
      });
    }
    
    this.logger.info(`Snapshot completed: ${snapshotName}`);
  }
}
