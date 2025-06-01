import { test as base, Page } from '@playwright/test';
import { BasicVideoCallPage } from '../pages/basicVideo/basicVideoPage';

type PageFixtures = {
  videoCallPage: BasicVideoCallPage;
};

export const test = base.extend<PageFixtures>({
  videoCallPage: async ({ page }: { page: Page }, use) => {
    const pageObj = new BasicVideoCallPage(page);
    await use(pageObj);
  },
});
