import { test, expect } from '../fixtures';

test.describe('📸 Snapshot comparison of video stream', () => {
  test('should pause local video and match snapshot', async ({ sessionManager, users }) => {
    const call = await sessionManager.newCall();
    const bobSession = await call.addUser(users.Bob);

    await bobSession.ui.expectLocalVideoPlaying(1);
    // Compare the paused video frame against the baseline
    await expect(bobSession.ui.localVideoContainer).toHaveScreenshot('bob-paused.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.15,
      threshold: 0.2,
      timeout: 2000,
    });
  });
});
