import { BrowserContext, Page } from '@playwright/test';
import { VideoCallPage } from '../../pages/basicVideo/videCallPage';

export type User = {
  userId: number;
  testUserName?: string;
  videoPathOverride?: string;
};

export type UserSession = {
  user: User;
  context: BrowserContext;
  page: Page;
  ui: VideoCallPage;
};

export type CallConfig = {
  appId: string;
  token: string;
  channel: string;
};
