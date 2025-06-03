import { BrowserType } from '@playwright/test';
import { VideoCallPage } from '../../pages/basicVideo/videCallPage';
import { CallConfig, User, UserSession } from './types';
import { defaultLogger } from '../logger';

export class Call {
  private users: UserSession[] = [];
  private logger = defaultLogger.withContext('Call');

  constructor(
    private browserType: BrowserType,
    private config: CallConfig,
    private getVideoPath: () => string | undefined
  ) {}

  async addUser(user: User): Promise<UserSession> {
    const logName = user.testUserName || `ID: ${user.userId}`;
    try {
      const videoPath = user.videoPathOverride ?? this.getVideoPath();

      const browser = await this.browserType.launch({
        headless: true,
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          '--disable-gpu',
          ...(videoPath ? [`--use-file-for-fake-video-capture=${videoPath}`] : []),
        ],
      });

      const context = await browser.newContext({
        permissions: ['camera', 'microphone'],
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();
      const ui = new VideoCallPage(page);

      await ui.navigateAndJoin(
        this.config.appId,
        this.config.token,
        this.config.channel,
        user.userId.toString()
      );
      const session: UserSession = { user, context, page, ui };
      this.users.push(session);
      this.logger.info(`Added user ${logName}. Total users: ${this.users.length}`);
      return session;
    } catch (error) {
      throw new Error(
        `Failed to add user ${logName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async removeUser(userId: number): Promise<void> {
    const index = this.users.findIndex((u) => u.user.userId === userId);
    if (index === -1) return;

    const { user, context, ui } = this.users[index];
    const label = user.testUserName || `ID: ${user.userId}`;

    try {
      await ui.leaveCall();
      await ui.expectNoLocalVideoPlaying();
    } catch (err) {
      this.logger.warn(`Leave error for user ${label}:`, err);
    } finally {
      await context.close();
      this.users.splice(index, 1);
      this.logger.info(`Removed user ${label}`);
    }
  }

  async cleanup(): Promise<void> {
    this.logger.header(`Starting cleanup of ${this.users.length} users`);
    for (const { context, user } of this.users) {
      const logName = user.testUserName || `ID: ${user.userId}`;
      try {
        this.logger.debug(`Closing context for user ${logName}`);
        await context.close();
        this.logger.debug(`Context closed for user ${logName}`);
      } catch (error) {
        this.logger.error(`Error closing context for user ${logName}:`, error);
      }
    }
    this.users = [];
    this.logger.info('All users cleaned up');
  }

  getUsers(): UserSession[] {
    return [...this.users];
  }
}
