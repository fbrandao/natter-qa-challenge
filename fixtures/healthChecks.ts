import { healthChecks } from '../utils/healthCheck/healthCheck';

// Configure health checks
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
          const { state } = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          return state === 'granted';
        } catch (e) {
          return false;
        }
      });
      return result;
    },
  });
