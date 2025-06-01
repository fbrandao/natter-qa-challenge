import { BrowserContext, Page } from '@playwright/test';
import { BasicVideoCallPage } from '../../pages/basicVideo/basicVideoPage';

export type User = {
  userId: number;
  testUserName?: string;
  videoPathOverride?: string;
};

export type UserSession = {
  user: User;
  context: BrowserContext;
  page: Page;
  ui: BasicVideoCallPage;
};

export type CallConfig = {
  appId: string;
  token: string;
  channel: string;
};
