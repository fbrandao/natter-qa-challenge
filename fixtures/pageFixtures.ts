import { test as base, Page } from '@playwright/test';
import { VideoCallPage } from '../pages/basicVideo/videCallPage';

type PageFixtures = {
  videoCallPage: VideoCallPage;
};

export const test = base.extend<PageFixtures>({
  videoCallPage: async ({ page }: { page: Page }, use) => {
    const pageObj = new VideoCallPage(page);
    await use(pageObj);
  },
});
