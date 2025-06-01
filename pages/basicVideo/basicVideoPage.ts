import { Locator, Page, expect, Response } from '@playwright/test';
import { BasePage } from '../base/basePage';

interface ApiRequest {
  method: string;
  url: string | RegExp;
}

export class BasicVideoCallPage extends BasePage {
  readonly url = '/basicVideoCall/index.html';

  readonly appIdInput: Locator = this.page.getByRole('textbox', { name: 'Enter the appid' });
  readonly tokenInput: Locator = this.page.getByRole('textbox', { name: 'Enter the app token' });
  readonly channelInput: Locator = this.page.getByRole('textbox', { name: 'Enter the channel name' });
  readonly userIdInput: Locator = this.page.getByRole('textbox', { name: 'Enter the user ID' });
  readonly joinButton: Locator = this.page.getByRole('button', { name: 'Join' });
  readonly leaveButton: Locator = this.page.getByRole('button', { name: 'Leave' });
  readonly advanceSettingsButton: Locator = this.page.getByRole('button', { name: 'ADVANCED SETTINGS' });

  readonly remoteVideoContainer: Locator = this.page.locator('video.agora_video_player');
  readonly localVideoContainer: Locator = this.page.locator('#local-player video.agora_video_player');
  readonly successAlertToast: Locator = this.page.getByRole('alert').getByText('Joined room successfully.')

  constructor(page: Page) {
    super(page);
  }

  private async waitForActionAndApiResponses(options: {
    requests: ApiRequest[];
    action: () => Promise<void>;
  }): Promise<Response[]> {
    const { requests, action } = options;

    const responsePromises = requests.map(request =>
      this.page.waitForResponse(resp => {
        const matchesUrl =
          typeof request.url === 'string'
            ? resp.url().includes(request.url)
            : request.url.test(resp.url());
        return matchesUrl && resp.request().method().toUpperCase() === request.method.toUpperCase();
      }),
    );

    const [responses] = await Promise.all([Promise.all(responsePromises), action()]);

    return responses;
  }

  async expectSuccessAlert() {
    await expect(this.successAlertToast).toBeVisible();
    await expect(this.successAlertToast).toContainText('Joined room successfully');
  }

  async navigateAndJoin(appId: string, token: string, channel: string, userId?: string) {
    await this.goto(this.url);
    await this.appIdInput.fill(appId);
    await this.tokenInput.fill(token);
    await this.channelInput.fill(channel);
    if (userId) await this.userIdInput.fill(userId);
    
    await this.waitForActionAndApiResponses({
      requests: [{
        method: 'POST',
        url: 'webrtc2-ap-web-1.agora.io/api/v2/transpond/webrtc'
      }],
      action: () => this.joinButton.click()
    });     
  }

  async leaveCall() {
    if (await this.leaveButton.isVisible()) {
      await this.leaveButton.click();
      // Wait for the local video container to become hidden after leaving
      await this.localVideoContainer.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * Asserts that the specified number of remote video elements are visible,
   * have enough data to play, and have valid dimensions.
   * @param count The expected number of remote video elements.
   * @param timeout The maximum time to wait for the assertion to pass (default: 15000ms).
   */
  async expectRemoteVideosPlaying(count: number, timeout: number = 15000) {
    await expect(async () => {
      const videos = await this.remoteVideoContainer.all();
      expect(videos.length).toBe(count);
      for (const video of videos) {
        await expect(video).toBeVisible();
        // Check if the video has enough data to play
        await expect(video).toHaveJSProperty('readyState', 4); // HTMLMediaElement.HAVE_ENOUGH_DATA
        // Check if the video has actual dimensions (i.e., not a black box)
        const videoWidth = await video.evaluate((el: HTMLVideoElement) => el.videoWidth);
        const videoHeight = await video.evaluate((el: HTMLVideoElement) => el.videoHeight);
        expect(videoWidth).toBeGreaterThan(0);
        expect(videoHeight).toBeGreaterThan(0);
        console.log(`Remote video dimensions: ${videoWidth}x${videoHeight}`);
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
    await expect(async () => {
      const videos = await this.localVideoContainer.all();
      expect(videos.length).toBe(count);
      for (const video of videos) {
        await expect(video).toBeVisible();
        // Check if the video has enough data to play
        await expect(video).toHaveJSProperty('readyState', 4); // HTMLMediaElement.HAVE_ENOUGH_DATA
        // Check if the video has actual dimensions (i.e., not a black box)
        const videoWidth = await video.evaluate((el: HTMLVideoElement) => el.videoWidth);
        const videoHeight = await video.evaluate((el: HTMLVideoElement) => el.videoHeight);
        expect(videoWidth).toBeGreaterThan(0);
        expect(videoHeight).toBeGreaterThan(0);
        console.log(`Local video dimensions: ${videoWidth}x${videoHeight}`);
      }
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
  }

  // Removed getMediaTrackStatus, expectAudioAndVideoActive, expectNoMediaTracks
  // as checking videoWidth/Height and readyState is more reliable for visual confirmation
  // when srcObject doesn't expose MediaStream tracks directly.

  /**
   * Asserts that no local video elements are visible or playing.
   * This is used after leaving the call.
   * @param timeout The maximum time to wait for the assertion to pass (default: 10000ms).
   */
  async expectNoLocalVideoPlaying(timeout: number = 10000) {
    await expect(async () => {
      const videos = await this.localVideoContainer.all();
      // Expect 0 video elements, or if elements exist, they should not be visible or playing
      if (videos.length === 0) {
        console.log('No local video elements found, as expected.');
        return; // Test passes if no elements are found
      }

      let anyVideoPlaying = false;
      for (const video of videos) {
        const isVisible = await video.isVisible();
        const readyState = await video.evaluate((el: HTMLVideoElement) => el.readyState);
        const videoWidth = await video.evaluate((el: HTMLVideoElement) => el.videoWidth);
        const videoHeight = await video.evaluate((el: HTMLVideoElement) => el.videoHeight);

        console.log(`Checking local video: visible=${isVisible}, readyState=${readyState}, dimensions=${videoWidth}x${videoHeight}`);

        if (isVisible || readyState === 4 || (videoWidth > 0 && videoHeight > 0)) {
          anyVideoPlaying = true;
          break; // Found a playing video, fail the assertion
        }
      }
      expect(anyVideoPlaying).toBeFalsy(); // Assert that no video is playing
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
  }

  /**
   * Asserts that no remote video elements are visible or playing.
   * This is used after leaving the call or when no remote users are expected.
   * @param timeout The maximum time to wait for the assertion to pass (default: 10000ms).
   */
  async expectNoRemoteVideoPlaying(timeout: number = 10000) {
    await expect(async () => {
      const videos = await this.remoteVideoContainer.all();
      if (videos.length === 0) {
        console.log('No remote video elements found, as expected.');
        return; // Test passes if no elements are found
      }

      let anyVideoPlaying = false;
      for (const video of videos) {
        const isVisible = await video.isVisible();
        const readyState = await video.evaluate((el: HTMLVideoElement) => el.readyState);
        const videoWidth = await video.evaluate((el: HTMLVideoElement) => el.videoWidth);
        const videoHeight = await video.evaluate((el: HTMLVideoElement) => el.videoHeight);

        console.log(`Checking remote video: visible=${isVisible}, readyState=${readyState}, dimensions=${videoWidth}x${videoHeight}`);

        if (isVisible || readyState === 4 || (videoWidth > 0 && videoHeight > 0)) {
          anyVideoPlaying = true;
          break; // Found a playing video, fail the assertion
        }
      }
      expect(anyVideoPlaying).toBeFalsy(); // Assert that no video is playing
    }).toPass({ timeout, intervals: [1000, 2000, 3000] });
  }
}
