import { test as base, Browser } from '@playwright/test';
import { SessionManager } from '../utils/session';
import { credentials } from '../config/env';

type SessionFixtures = {
  sessionManager: SessionManager;
};

export const test = base.extend<SessionFixtures>({
  sessionManager: async ({ browser }: { browser: Browser }, use) => {
    const manager = new SessionManager(browser, {
      appId: credentials.appId,
      token: credentials.token,
      channel: credentials.channel,
    });
    await use(manager);
  },
});
