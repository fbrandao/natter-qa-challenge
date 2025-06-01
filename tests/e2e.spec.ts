import { credentials } from '../config/env';
import { test } from '../fixtures/pageFixtures';

test.describe.serial('🔒 Basic WebRTC Checks for single users', () => {
  test.beforeEach(async ({ videoCallPage }) => {
    await test.step('Join the video call', async () => {
      await videoCallPage.navigateAndJoin(
        credentials.appId,
        credentials.token,
        credentials.channel,
        credentials.userId
      );

    });
  });
  

  test('should join the call, show success alert and play local video', async ({ videoCallPage }) => {
    await test.step('Verify local video is visible and ready', async () => {
      await videoCallPage.expectSuccessAlert();
      await videoCallPage.expectLocalVideoPlaying(1);
    });
  });

  test('should not have local video playing after leaving the call', async ({ videoCallPage }) => {
    // The beforeEach ensures streams are active at the start of this test
    await test.step('Leave the call', async () => {
      await videoCallPage.leaveCall();
    });

    await test.step('Verify local video is stopped', async () => {
      await videoCallPage.expectNoLocalVideoPlaying();
    });
  });
});
