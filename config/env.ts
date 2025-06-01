import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment detection
const NODE_ENV = process.env.NODE_ENV;
const CI = process.env.CI === 'true';

export const isCI = CI;
export const isTest = NODE_ENV === 'test';
export const isProduction = NODE_ENV === 'production';
export const isLocal = !isCI && !isProduction && !isTest;

export const environment = isLocal
  ? 'local'
  : isCI
    ? 'ci'
    : isTest
      ? 'test'
      : isProduction
        ? 'production'
        : 'local';

// Test paths configuration
export const testPaths = {
  videos: path.resolve(__dirname, '../videos/fake_video.y4m'),
  reports: path.resolve(__dirname, '../reports'),
  results: path.resolve(__dirname, '../test-results'),
  testDir: path.resolve(__dirname, '../tests'),
  fixtures: path.resolve(__dirname, '../tests/fixtures'),
  e2e: path.resolve(__dirname, '../tests/e2e'),
} as const;

// Load .env only in local
if (isLocal) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

/**
 * Retrieves an environment variable with optional error handling.
 */
export function getEnvVar(key: string, required = true): string {
  const val = process.env[key];
  if (!val && required) throw new Error(`❌ Missing required env var: ${key}`);
  return val || '';
}

// Agora credentials
export const credentials = {
  appId: getEnvVar('AGORA_APP_ID'),
  token: getEnvVar('AGORA_TOKEN'),
  channel: getEnvVar('AGORA_CHANNEL'),
  userId: randomUUID(),
}; 