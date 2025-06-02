import { test, expect } from '../fixtures';
import { UserSession } from '../utils/session/types';

test.describe('📸 Snapshot comparison of video streams', () => {
  const userNames = ['Bob', 'Alice', 'Claire', 'MissAm'] as const;

  test(`should render full grid and match snapshots for all users`, async ({
    sessionManager,
    users,
  }) => {
    const call = await sessionManager.newCall();

    const sessions: UserSession[] = [];

    for (const name of userNames) {
      const session = await call.addUser(users[name]);
      await test.step(`${name}: expect local video playing`, async () => {
        await session.ui.expectLocalVideoPlaying(1);
      });
      await test.step(`${name}: snapshot local video`, async () => {
        await expect(session.ui.localVideoContainer).toHaveScreenshot(
          `${name.toLowerCase()}-paused.png`,
          {
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            maxDiffPixelRatio: 0.15,
            threshold: 0.2,
            timeout: 8000,
          }
        );
      });

      sessions.push(session);
    }

    // Snapshot the video grid layout from the first user’s view
    await test.step(`Snapshot full grid from ${userNames[0]}'s perspective`, async () => {
      await sessions[0].ui.snapshotVideoGrid('4-users');
    });
  });
});
