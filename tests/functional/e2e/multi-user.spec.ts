import { test } from '../../../fixtures';
import { User, UserSession } from '../../../utils/session/types';
import { Call } from '../../../utils/session/call';
import { faker } from '@faker-js/faker';

test.describe.serial('🔒 Multi-user WebRTC Scenarios', () => {
  test.beforeEach(async ({ sessionManager }) => {
    await test.step('Cleanup any existing calls', async () => {
      await sessionManager.cleanup();
    });
  });

  test('Should handle user leaving and UI updates correctly', async ({ sessionManager }) => {
    let call: Call;
    let alice: User;
    let bob: User;
    let aliceSession: UserSession;
    let bobSession: UserSession;

    await test.step('Create call and add initial users', async () => {
      call = await sessionManager.newCall();
      [alice, bob] = sessionManager.createUsers(2, faker.person.firstName());
      aliceSession = await call.addUser(alice);
      bobSession = await call.addUser(bob);
      await aliceSession.ui.expectSuccessAlert();
      await aliceSession.ui.expectLocalVideoPlaying(1);
      await bobSession.ui.expectSuccessAlert();
      await bobSession.ui.expectLocalVideoPlaying(1);
    });

    await test.step('Verify initial state for both users', async () => {
      // --- Verify for Alice ---
      await aliceSession.ui.expectLocalVideoPlaying(1);
      await aliceSession.ui.expectRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteVideosPlaying(1);

      // --- Verify for Bob ---
      await bobSession.ui.expectLocalVideoPlaying(1);
      await bobSession.ui.expectRemoteUserVideoPlaying(alice);
      await bobSession.ui.expectRemoteVideosPlaying(1);
    });

    await test.step('Bob leaves and verify UI updates', async () => {
      await bobSession.ui.leaveCall();
      await bobSession.ui.expectNoLocalVideoPlaying();
      await bobSession.context.close();
      console.log(
        `User ${bobSession.user.testUserName} (ID: ${bobSession.user.userId}) has left and their context is closed.`
      );

      await aliceSession.ui.expectNoRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteVideosPlaying(0);
      await aliceSession.ui.expectLocalVideoPlaying(1);
    });
  });

  test('Should handle multiple users joining in sequence', async ({ sessionManager }) => {
    let call: Call;
    let alice: User;
    let bob: User;
    let charlie: User;
    let aliceSession: UserSession;
    let bobSession: UserSession;
    let charlieSession: UserSession;

    await test.step('Create call and add Alice', async () => {
      call = await sessionManager.newCall();
      [alice] = sessionManager.createUsers(1, faker.person.firstName());
      aliceSession = await call.addUser(alice);
      await aliceSession.ui.expectLocalVideoPlaying(1);
      await aliceSession.ui.expectRemoteVideosPlaying(0);
    });

    await test.step('Add Bob and verify mutual visibility', async () => {
      [bob] = sessionManager.createUsers(1, faker.person.firstName());
      bobSession = await call.addUser(bob);

      // Alice should see Bob
      await aliceSession.ui.expectRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteVideosPlaying(1);

      // Bob should see Alice
      await bobSession.ui.expectLocalVideoPlaying(1);
      await bobSession.ui.expectRemoteUserVideoPlaying(alice);
      await bobSession.ui.expectRemoteVideosPlaying(1);
    });

    await test.step('Add Charlie and verify all users can see each other', async () => {
      [charlie] = sessionManager.createUsers(1, faker.person.firstName());
      charlieSession = await call.addUser(charlie);

      // Alice should see Bob and Charlie
      await aliceSession.ui.expectRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteUserVideoPlaying(charlie);
      await aliceSession.ui.expectRemoteVideosPlaying(2);

      // Bob should see Alice and Charlie
      await bobSession.ui.expectRemoteUserVideoPlaying(alice);
      await bobSession.ui.expectRemoteUserVideoPlaying(charlie);
      await bobSession.ui.expectRemoteVideosPlaying(2);

      // Charlie should see Alice and Bob
      await charlieSession.ui.expectLocalVideoPlaying(1);
      await charlieSession.ui.expectRemoteUserVideoPlaying(alice);
      await charlieSession.ui.expectRemoteUserVideoPlaying(bob);
      await charlieSession.ui.expectRemoteVideosPlaying(2);
    });
  });

  test('Should handle user reconnection after disconnection', async ({ sessionManager }) => {
    let call: Call;
    let alice: User;
    let bob: User;
    let aliceSession: UserSession;
    let bobSession: UserSession;

    await test.step('Create call and add initial users', async () => {
      call = await sessionManager.newCall();
      [alice, bob] = sessionManager.createUsers(2, faker.person.firstName());
      aliceSession = await call.addUser(alice);
      bobSession = await call.addUser(bob);
    });

    await test.step('Bob disconnects and Alice verifies his departure', async () => {
      await bobSession.context.close();
      await aliceSession.ui.expectNoRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteVideosPlaying(0);
    });

    await test.step('Bob reconnects and verify mutual visibility', async () => {
      const newCall = await sessionManager.newCall();
      [bob] = sessionManager.createUsers(1, faker.person.firstName());
      bobSession = await newCall.addUser(bob);

      // Alice should now see the reconnected Bob
      await aliceSession.ui.expectRemoteUserVideoPlaying(bob);
      await aliceSession.ui.expectRemoteVideosPlaying(1);

      // Reconnected Bob should see Alice
      await bobSession.ui.expectLocalVideoPlaying(1);
      await bobSession.ui.expectRemoteUserVideoPlaying(alice);
      await bobSession.ui.expectRemoteVideosPlaying(1);
    });
  });
});
