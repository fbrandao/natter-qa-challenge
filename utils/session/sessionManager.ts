import { BrowserType } from '@playwright/test';
import { Call } from './call';
import { CallConfig, User } from './types';
import { faker } from '@faker-js/faker';
import * as path from 'path';
import { paths } from '../../config/env';
import { defaultLogger } from '../logger';

export class SessionManager {
  private calls: Call[] = [];
  private videoFiles: string[];
  private logger = defaultLogger.withContext('SessionManager');

  constructor(
    private browserType: BrowserType,
    private config: CallConfig
  ) {
    this.videoFiles = [
      path.join(paths.videos, '/randomUsers/salesman_qcif.y4m'),
      path.join(paths.videos, '/randomUsers/sign_irene_qcif.y4m'),
      path.join(paths.videos, '/randomUsers/silent_qcif.y4m'),
      path.join(paths.videos, '/randomUsers/suzie_qcif.y4m'),
    ];
  }

  private getRandomVideoFilePath(): string | undefined {
    if (this.videoFiles.length === 0) return undefined;
    return faker.helpers.arrayElement(this.videoFiles);
  }

  async newCall(config?: CallConfig): Promise<Call> {
    const callConfig = config ?? this.config;
    const call = new Call(this.browserType, callConfig, this.getRandomVideoFilePath.bind(this));
    this.calls.push(call);
    this.logger.info(`Created new call. Total calls: ${this.calls.length}`);
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
    this.logger.header(`Starting cleanup of ${this.calls.length} calls`);
    const callsToCleanup = [...this.calls];
    for (const call of callsToCleanup) {
      try {
        this.logger.debug('Cleaning up call...');
        await call.cleanup();
        this.logger.debug('Call cleanup complete');
      } catch (error) {
        this.logger.error('Error during call cleanup:', error);
      }
    }
    this.calls = [];
    this.logger.info('All calls cleaned up');
  }

  getCalls(): Call[] {
    return [...this.calls];
  }
}
