// sessionManager.ts

import { Browser } from '@playwright/test';
import { Call } from './call';
import { CallConfig, User } from './types'; // Import User type
import { faker } from '@faker-js/faker';

export class SessionManager {
  private calls: Call[] = [];
  // Global counter for user IDs, unique across all calls created by this SessionManager instance
  private globalUserIdCounter: number = 1000;

  constructor(
    private browser: Browser,
    private config: CallConfig
  ) {}

  /**
   * Creates a new Call instance.
   * @returns A new Call object.
   */
  async newCall(): Promise<Call> {
    const call = new Call(this.browser, this.config);
    this.calls.push(call);
    return call;
  }

  /**
   * Generates an array of unique User objects.
   * Each user will have a unique numeric ID and an optional friendly name.
   *
   * @param count The number of unique users to create.
   * @param baseName Optional base name for users (e.g., 'User', 'Participant'). Names will be 'baseName1', 'baseName2', etc.
   * @returns An array of User objects.
   */
  createUsers(count: number, baseName: string = 'User'): User[] {
    if (count <= 0) {
      return [];
    }

    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const newUser: User = {
        userId: faker.number.int({ min: 10000, max: 99999 }),
        testUserName: `${baseName}${i + 1}`,
      };
      users.push(newUser);
    }
    console.log(
      `Generated ${count} users with IDs from ${users[0].userId} to ${users[users.length - 1].userId}`
    );
    return users;
  }

  /**
   * Cleans up all active calls managed by this SessionManager.
   */
  async cleanup(): Promise<void> {
    console.log('SessionManager initiating global cleanup for all calls...');
    for (const call of this.calls) {
      await call.cleanup();
    }
    this.calls = [];
    console.log('SessionManager global cleanup complete.');
  }

  getCalls(): Call[] {
    return [...this.calls];
  }
}
