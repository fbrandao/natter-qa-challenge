import { test } from '../fixtures';
import { faker } from '@faker-js/faker';
import { Call } from '../utils/session/call';
import { User, UserSession } from '../utils/session/types';

test.describe.serial('🔒 Basic WebRTC Checks for single users', () => {
  let call: Call;
  let bob: User;
  let bobSession: UserSession;

  test.beforeEach(async ({ sessionManager }) => {
    await test.step('Join the video call', async () => {
      call = await sessionManager.newCall();
      bob = sessionManager.createUsers(1, faker.person.firstName())[0];
      bobSession = await call.addUser(bob);
    });
  });

  test('should join the call, show success alert and play local video', async () => {
    await test.step('Verify local video is visible and ready', async () => {
      await bobSession.ui.expectSuccessAlert();
      await bobSession.ui.expectLocalVideoPlaying(1);
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
