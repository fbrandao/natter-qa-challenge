import { BrowserType } from '@playwright/test';
import { Call } from './call';
import { CallConfig, User } from './types';
import { faker } from '@faker-js/faker';
import * as path from 'path';
import { testPaths } from '../../config/env';

export class SessionManager {
  private calls: Call[] = [];
  private videoFiles: string[];

  constructor(
    private browserType: BrowserType,
    private config: CallConfig
  ) {
    this.videoFiles = [
      path.join(testPaths.videos, '/randomUsers/salesman_qcif.y4m'),
      path.join(testPaths.videos, '/randomUsers/sign_irene_qcif.y4m'),
      path.join(testPaths.videos, '/randomUsers/silent_qcif.y4m'),
      path.join(testPaths.videos, '/randomUsers/suzie_qcif.y4m'),
    ];
  }

  private getRandomVideoFilePath(): string | undefined {
    console.log('Using video path:', this.videoFiles);
    if (this.videoFiles.length === 0) return undefined;
    console.log('Random video file path:', faker.helpers.arrayElement(this.videoFiles));
    return faker.helpers.arrayElement(this.videoFiles);
  }

  async newCall(): Promise<Call> {
    const call = new Call(this.browserType, this.config, this.getRandomVideoFilePath.bind(this));
    this.calls.push(call);
    console.log(`[SessionManager] Created new call. Total calls: ${this.calls.length}`);
    return call;
  }

  createUsers(count: number, baseName = 'User'): User[] {
    return Array.from({ length: count }, (_, i) => ({
      userId: faker.number.int({ min: 10000, max: 99999 }),
      testUserName: `${baseName}${i + 1}`,
      videoPathOverride: this.getRandomVideoFilePath(),
    }));
  }

  async cleanup(): Promise<void> {
    console.log(`[SessionManager] Starting cleanup of ${this.calls.length} calls...`);
    const callsToCleanup = [...this.calls]; // Create a copy to avoid modification during iteration
    for (const call of callsToCleanup) {
      try {
        console.log('[SessionManager] Cleaning up call...');
        await call.cleanup();
        console.log('[SessionManager] Call cleanup complete');
      } catch (error) {
        console.error('[SessionManager] Error during call cleanup:', error);
      }
    }
    this.calls = [];
    console.log('[SessionManager] All calls cleaned up');
  }

  getCalls(): Call[] {
    return [...this.calls];
  }
}
