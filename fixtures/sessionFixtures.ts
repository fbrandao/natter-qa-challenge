import { test as base, chromium } from '@playwright/test';
import { SessionManager } from '../utils/session';
import { config } from '../config/env';

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
          appId: config.auth.agora.appId,
          token: config.auth.agora.token,
          channel: config.auth.agora.channel,
        });
      }

      await use(globalSessionManager);
    },
    { auto: true },
  ],
});
