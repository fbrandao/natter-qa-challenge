import { test } from '../fixtures';
import { UserSession } from '../utils/session/types';

test.describe.serial('📸 Snapshot comparison of video streams', () => {
  const userNames = ['Bob', 'Alice', 'Claire', 'MissAm'] as const;

  test('should render and match snapshot for single user', async ({ sessionManager, users }) => {
    const call = await sessionManager.newCall();
    const userName = 'Bob';
    const session = await call.addUser(users[userName]);

    // Wait for local video to be playing
    await test.step(`${userName}: expect local video playing`, async () => {
      await session.ui.expectLocalVideoPlaying(1);
    });

    // Take snapshot of single user view
    await test.step(`${userName}: snapshot single user grid`, async () => {
      await session.ui.snapshotVideoGrid(`single-user-${userName.toLowerCase()}-perspective`);
    });
  });

  test('should render and match snapshots for multiple users', async ({
    sessionManager,
    users,
  }) => {
    const call = await sessionManager.newCall();
    const sessions: UserSession[] = [];

    // Add all users to the call
    await test.step('add all users to call', async () => {
      for (const name of userNames) {
        const session = await call.addUser(users[name]);
        sessions.push(session);
      }
    });

    // Ensure all videos are playing
    await test.step('verify all videos are playing', async () => {
      for (const [index, session] of sessions.entries()) {
        await test.step(`${userNames[index]}: verify local and remote videos`, async () => {
          await session.ui.expectLocalVideoPlaying(1);
          await session.ui.expectRemoteVideosPlaying(userNames.length - 1);
        });
      }
    });

    // Take a snapshot from each user's perspective
    await test.step('take snapshots from each perspective', async () => {
      for (const [index, session] of sessions.entries()) {
        const name = userNames[index];
        await test.step(`snapshot from ${name}'s perspective`, async () => {
          await session.ui.snapshotVideoGrid(`multi-user-${name.toLowerCase()}-perspective`);
        });
      }
    });
  });
});
