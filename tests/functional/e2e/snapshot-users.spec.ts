import { test } from '../../../fixtures';
import { UserSession } from '../../../utils/session/types';

test.describe.serial('📸 Snapshot comparison of video streams', () => {
  const userNames = ['Bob', 'Alice', 'Claire'] as const;

  test.beforeEach(async ({ sessionManager }) => {
    await test.step('Cleanup any existing calls', async () => {
      await sessionManager.cleanup();
    });
  });

  test('should render and match snapshot for single user', async ({ sessionManager, users }) => {
    const call = await sessionManager.newCall();
    const userName = 'Bob';
    const session = await call.addUser(users[userName]);

    await test.step(`${userName}: expect local video playing`, async () => {
      await session.ui.expectLocalVideoPlaying(1);
    });

    await test.step(`${userName}: snapshot single user grid`, async () => {
      await session.ui.snapshotVideoGrid(`single-user-${userName.toLowerCase()}-perspective`);
    });
  });

  test('should render and match snapshots for multiple users', async ({
    sessionManager,
    users,
  }) => {
    console.log('[DEBUG_TEST] Starting multi-user snapshot test');
    const call = await sessionManager.newCall();
    const sessions: UserSession[] = [];

    await test.step('add all users to call', async () => {
      console.log('[DEBUG_TEST] Adding all users to call');
      for (const name of userNames) {
        console.log(`[DEBUG_TEST] Adding user ${name}`);
        const session = await call.addUser(users[name]);
        await test.step(`${name}: wait for video to be active`, async () => {
          await session.ui.expectLocalVideoPlaying(1);
        });
        sessions.push(session);
        console.log(`[DEBUG_TEST] User ${name} added successfully`);
      }
    });

    await test.step('verify all videos are playing', async () => {
      for (const [index, session] of sessions.entries()) {
        await test.step(`${userNames[index]}: verify local and remote videos`, async () => {
          await session.ui.expectLocalVideoPlaying(1);
          await session.ui.expectRemoteVideosPlaying(userNames.length - 1);
        });
      }
    });

    await test.step('verify full grid snapshot from last user', async () => {
      const lastUserName = userNames[userNames.length - 1];
      await sessions[sessions.length - 1].ui.snapshotVideoGrid(
        `multi-user-${lastUserName.toLowerCase()}-perspective`
      );
    });
  });
});
