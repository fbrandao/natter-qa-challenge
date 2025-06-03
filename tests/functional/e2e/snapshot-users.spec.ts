import { test } from '../../../fixtures';
import { UserSession } from '../../../utils/session/types';

test.describe.serial('📸 Snapshot comparison of video streams', () => {
  const userNames = ['Bob', 'Alice', 'Claire'] as const;

  test.beforeEach(async ({ sessionManager }) => {
    await test.step('Cleanup any existing calls', async () => {
      console.log('[DEBUG_TEST] Starting cleanup of existing calls');
      await sessionManager.cleanup();
      console.log('[DEBUG_TEST] Cleanup completed');
    });
  });

  test('should render and match snapshot for single user', async ({ sessionManager, users }) => {
    console.log('[DEBUG_TEST] Starting single user snapshot test');
    const call = await sessionManager.newCall();
    const userName = 'Bob';
    console.log(`[DEBUG_TEST] Adding user ${userName} to call`);
    const session = await call.addUser(users[userName]);

    // Wait for local video to be playing
    await test.step(`${userName}: expect local video playing`, async () => {
      console.log(`[DEBUG_TEST] Waiting for local video to be playing for ${userName}`);
      await session.ui.expectLocalVideoPlaying(1);
      console.log(`[DEBUG_TEST] Local video is playing for ${userName}`);
    });

    // Take snapshot of single user view
    await test.step(`${userName}: snapshot single user grid`, async () => {
      console.log(`[DEBUG_TEST] Taking snapshot for ${userName}`);
      await session.ui.snapshotVideoGrid(`single-user-${userName.toLowerCase()}-perspective`);
      console.log(`[DEBUG_TEST] Snapshot completed for ${userName}`);
    });
  });

  test('should render and match snapshots for multiple users', async ({
    sessionManager,
    users,
  }) => {
    console.log('[DEBUG_TEST] Starting multi-user snapshot test');
    const call = await sessionManager.newCall();
    const sessions: UserSession[] = [];

    // Add all users to the call
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

    // Ensure all videos are playing
    await test.step('verify all videos are playing', async () => {
      console.log('[DEBUG_TEST] Verifying all videos are playing');
      for (const [index, session] of sessions.entries()) {
        await test.step(`${userNames[index]}: verify local and remote videos`, async () => {
          console.log(`[DEBUG_TEST] Checking videos for ${userNames[index]}`);
          await session.ui.expectLocalVideoPlaying(1);
          await session.ui.expectRemoteVideosPlaying(userNames.length - 1);
          console.log(`[DEBUG_TEST] Videos verified for ${userNames[index]}`);
        });
      }
    });

    // Take a snapshot from each user's perspective
    await test.step('verify full grid snapshot from last user', async () => {
      const lastUserName = userNames[userNames.length - 1];
      console.log(`[DEBUG_TEST] Taking snapshot from ${lastUserName}'s perspective`);
      await sessions[sessions.length - 1].ui.snapshotVideoGrid(
        `multi-user-${lastUserName.toLowerCase()}-perspective`
      );
      console.log(`[DEBUG_TEST] Snapshot completed for ${lastUserName}`);
    });
  });
});
