import { BrowserType } from '@playwright/test';
import { BasicVideoCallPage } from '../../pages/basicVideo/basicVideoPage';
import { CallConfig, User, UserSession } from './types';

export class Call {
  private users: UserSession[] = [];

  constructor(
    private browserType: BrowserType, // ✅ use BrowserType instead of Browser
    private config: CallConfig,
    private getVideoPath: () => string | undefined
  ) {}

  async addUser(user: User): Promise<UserSession> {
    const logName = user.testUserName || `ID: ${user.userId}`;
    try {
      const videoPath = user.videoPathOverride ?? this.getVideoPath();

      const browser = await this.browserType.launch({
        headless: false,
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          ...(videoPath ? [`--use-file-for-fake-video-capture=${videoPath}`] : []),
        ],
      });

      const context = await browser.newContext({
        permissions: ['camera', 'microphone'],
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      const ui = new BasicVideoCallPage(page);

      await ui.navigateAndJoin(
        this.config.appId,
        this.config.token,
        this.config.channel,
        user.userId.toString()
      );
      await ui.expectSuccessAlert();
      await ui.expectLocalVideoPlaying(1);

      const session: UserSession = { user, context, page, ui };
      this.users.push(session);
      console.log(`[Call] Added user ${logName}. Total users: ${this.users.length}`);
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
      console.warn(`Leave error for user ${label}:`, err);
    } finally {
      await context.close();
      this.users.splice(index, 1);
      console.log(`Removed user ${label}`);
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[Call] Starting cleanup of ${this.users.length} users...`);
    for (const { context, user } of this.users) {
      const logName = user.testUserName || `ID: ${user.userId}`;
      try {
        console.log(`[Call] Closing context for user ${logName}...`);
        await context.close();
        console.log(`[Call] Context closed for user ${logName}`);
      } catch (error) {
        console.error(`[Call] Error closing context for user ${logName}:`, error);
      }
    }
    this.users = [];
    console.log('[Call] All users cleaned up');
  }

  getUsers(): UserSession[] {
    return [...this.users];
  }
}
