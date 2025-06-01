// call.ts

import { Browser } from '@playwright/test';
import { BasicVideoCallPage } from '../../pages/basicVideo/basicVideoPage';
import { CallConfig, User, UserSession } from './types'; // Import User type

export class Call {
  private users: UserSession[] = [];
  // REMOVE: private userIdCounter: number = 1000; // This counter is now in SessionManager

  constructor(
    private browser: Browser,
    private config: CallConfig
  ) {}

  /**
   * Adds a pre-defined User object to the call.
   * The User object must contain a unique numeric ID.
   *
   * @param user The User object (containing userId and optional testUserName) to add to the call.
   * @returns The UserSession object.
   */
  async addUser(user: User): Promise<UserSession> {
    // Now accepts a User object directly
    try {
      const context = await this.browser.newContext({
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      const ui = new BasicVideoCallPage(page);

      // Pass the user.userId (converted to string) to the UI.
      await ui.navigateAndJoin(
        this.config.appId,
        this.config.token,
        this.config.channel,
        user.userId.toString() // Use the userId from the provided User object
      );

      // Verify immediate success on join
      await ui.expectSuccessAlert();
      await ui.expectLocalVideoPlaying(1);

      const userSession: UserSession = {
        user: user, // Store the provided User object
        context,
        page,
        ui,
      };
      this.users.push(userSession);
      return userSession;
    } catch (error) {
      const logIdentifier = user.testUserName
        ? `${user.testUserName} (ID: ${user.userId})`
        : `ID: ${user.userId}`;
      throw new Error(
        `Failed to add user ${logIdentifier}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Removes a specific user from the call by their numeric user ID.
   *
   * @param userId The numeric user ID of the user to remove.
   */
  async removeUser(userId: number): Promise<void> {
    const userIndex = this.users.findIndex((session) => session.user.userId === userId);
    if (userIndex === -1) {
      console.warn(
        `Attempted to remove user with ID ${userId}, but they were not found in the call.`
      );
      return;
    }

    const userSession = this.users[userIndex];
    const logIdentifier = userSession.user.testUserName
      ? `${userSession.user.testUserName} (ID: ${userSession.user.userId})`
      : `ID: ${userSession.user.userId}`;

    try {
      await userSession.ui.leaveCall();
      await userSession.ui.expectNoLocalVideoPlaying();
    } catch (error) {
      console.warn(
        `Warning: Error while user ${logIdentifier} was attempting to leave call gracefully:`,
        error
      );
    } finally {
      try {
        await userSession.context.close();
        console.log(`Closed context for user: ${logIdentifier}`);
      } catch (error) {
        console.error(`Error closing context for user ${logIdentifier}:`, error);
      }
      this.users.splice(userIndex, 1);
    }
  }

  /**
   * Cleans up all users in this specific call instance by closing their contexts.
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.users.length} users for this call...`);
    for (const userSession of this.users) {
      const logIdentifier = userSession.user.testUserName
        ? `${userSession.user.testUserName} (ID: ${userSession.user.userId})`
        : `ID: ${userSession.user.userId}`;
      if (userSession.page.isClosed() === false) {
        try {
          await userSession.ui.leaveCall();
          await userSession.ui.expectNoLocalVideoPlaying();
        } catch (error) {
          console.warn(
            `Warning during cleanup leave for user ${logIdentifier}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      try {
        await userSession.context.close();
        console.log(`Context closed for user ${logIdentifier}`);
      } catch (error) {
        console.error(
          `Error during final context close for user ${logIdentifier}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    this.users = [];
    console.log('Call cleanup complete.');
  }

  getUsers(): UserSession[] {
    return [...this.users];
  }
}
