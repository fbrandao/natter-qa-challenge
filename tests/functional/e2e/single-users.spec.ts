import { test } from '../../../fixtures';
import { Call } from '../../../utils/session/call';
import { UserSession, User } from '../../../utils/session/types';

test.describe.serial('🔒 Basic WebRTC Checks for single users', () => {
  let call: Call;
  let bobSession: UserSession;

  test.beforeEach(async ({ sessionManager, users }) => {
    await test.step('Join the video call', async () => {
      call = await sessionManager.newCall();
      bobSession = await call.addUser(users.Bob);
    });
  });

  test('should join the call, show success alert and play local video', async () => {
    await test.step('Verify local video is visible and ready', async () => {
      await bobSession.ui.expectSuccessAlert();
      await bobSession.ui.expectLocalVideoPlaying(1);
    });
  });

  test('should fail to join the call with invalid credentials', async ({ sessionManager }) => {
    const invalidConfig = {
      appId: 'invalid-app-id',
      token: 'invalid-token',
      channel: 'invalid-channel',
    };

    let invalidUserSession: UserSession;
    let invalidUser: User;
    let invalidCall: Call;

    await test.step('Try to join with invalid credentials', async () => {
      invalidCall = await sessionManager.newCall(invalidConfig);
      invalidUser = sessionManager.createUsers(1, 'InvalidUser')[0];

      invalidUserSession = await invalidCall.addUser(invalidUser);
    });

    await test.step('Verify that the user is not able to join the call', async () => {
      await invalidUserSession.ui.expectNoLocalVideoPlaying();
    });
  });

  test('should not have local video playing after leaving the call', async () => {
    await test.step('Leave the call', async () => {
      await bobSession.ui.leaveCall();
    });

    await test.step('Verify local video is stopped', async () => {
      await bobSession.ui.expectNoLocalVideoPlaying();
    });
  });
});
