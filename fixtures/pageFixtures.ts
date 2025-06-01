// fixtures/pageFixtures.ts
import { test as base } from '@playwright/test';
import { runHealthChecks, healthChecks } from '../utils/healthCheck';
import { BasicVideoCallPage } from '../pages/basicVideo/basicVideoPage';

type PageFixtures = {
  videoCallPage: BasicVideoCallPage;
};

healthChecks
  .add({
    name: 'Camera Permission',
    check: async (page) => {
      const result = await page.evaluate(async () => {
        try {
          const { state } = await navigator.permissions.query({ name: 'camera' as PermissionName });
          return state === 'granted';
        } catch (e) {
          return false;
        }
      });
      return result;
    },
  })
  .add({
    name: 'Microphone Permission',
    check: async (page) => {
      const result = await page.evaluate(async () => {
        try {
          const { state } = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          return state === 'granted';
        } catch (e) {
          return false;
        }
      });
      return result;
    },
  });

const test = base.extend<PageFixtures>({
  videoCallPage: async ({ page }, use) => {
    await use(new BasicVideoCallPage(page));    
  },
});

test.beforeEach(async ({ page }) => {
  await test.step('Run media device health checks', async () => {
    await runHealthChecks(page);
  });
});

export { test };
export { expect } from '@playwright/test';
