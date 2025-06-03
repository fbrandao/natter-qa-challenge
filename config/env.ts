import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

// ESM-specific path resolution
const dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment detection
const NODE_ENV = process.env.NODE_ENV;
const CI = process.env.CI === 'true';

const isCI = CI;
const isTest = NODE_ENV === 'test';
const isProduction = NODE_ENV === 'production';
const isLocal = !isCI && !isProduction && !isTest;

const environment = isLocal
  ? 'local'
  : isCI
    ? 'ci'
    : isTest
      ? 'test'
      : isProduction
        ? 'production'
        : 'local';

// Load .env only in local
if (isLocal) {
  // Try to load .env from both current directory and root directory
  const rootDir = path.resolve(dirname, '..');
  dotenv.config({ path: path.resolve(rootDir, '.env') });
  // Also try current directory as fallback
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

/**
 * Retrieves an environment variable with optional error handling.
 */
function getEnvVar(key: string, required = true): string {
  const val = process.env[key];
  if (!val && required) throw new Error(`❌ Missing required env var: ${key}`);
  return val || '';
}

export const config = {
  // Environment information
  env: {
    isCI,
    isTest,
    isProduction,
    isLocal,
    environment,
    NODE_ENV,
  },

  // Application URLs
  urls: {
    baseUrls: {
      local: 'http://localhost:3000',
      ci: 'http://ci-app.example.com',
      test: 'http://test-app.example.com',
      production: 'https://app.example.com',
    },
    get baseUrl() {
      return this.baseUrls[environment];
    },
  },

  // File system paths
  paths: {
    videos: path.resolve(dirname, '../videos'),
    reports: path.resolve(dirname, '../reports'),
    results: path.resolve(dirname, '../test-results'),
    testDir: path.resolve(dirname, '../tests'),
    fixtures: path.resolve(dirname, '../tests/fixtures'),
    e2e: path.resolve(dirname, '../tests/e2e'),
    snapshots: path.resolve(dirname, '../snapshots'),
  },

  // Credentials and authentication
  auth: {
    agora: {
      appId: getEnvVar('AGORA_APP_ID'),
      token: getEnvVar('AGORA_TOKEN'),
      channel: getEnvVar('AGORA_CHANNEL'),
      userId: randomUUID(),
    }
  },

  // Test configuration
  test: {
    timeout: 30000,
    retries: 2,
    workers: process.env.CI ? 1 : undefined,
  },
} as const;

// Export individual config sections for convenience
export const { env, urls, paths, auth, test } = config;
