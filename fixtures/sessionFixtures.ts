import { test as base, chromium } from '@playwright/test';
import { SessionManager } from '../utils/session';
import { credentials } from '../config/env';

type SessionFixtures = {
  sessionManager: SessionManager;
};

// Single instance of SessionManager
let globalSessionManager: SessionManager | null = null;

export const test = base.extend<SessionFixtures>({
  sessionManager: [
    async ({}, use) => {
      if (!globalSessionManager) {
        globalSessionManager = new SessionManager(chromium, {
          appId: credentials.appId,
          token: credentials.token,
          channel: credentials.channel,
        });
      }

      await use(globalSessionManager);
    },
    { auto: true },
  ],
});
