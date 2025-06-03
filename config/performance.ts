import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Environment detection
const NODE_ENV = process.env.NODE_ENV;
const CI = process.env.CI === 'true';

const isCI = CI;
const isTest = NODE_ENV === 'test';
const isProduction = NODE_ENV === 'production';
const isLocal = !isCI && !isProduction && !isTest;

// Load .env only in local
if (isLocal) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

function getEnvVar(key: string, required = false) {
  const val = process.env[key];
  if (!val && required) throw new Error(`Missing env var: ${key}`);
  return val || '';
}

const config = {
  paths: {
    videos: path.resolve(__dirname, '../../../videos'),
    reports: path.resolve(__dirname, '../../../reports/performance')
  },
  auth: {
    agora: {
      appId: getEnvVar('AGORA_APP_ID', false),
      token: getEnvVar('AGORA_TOKEN', false),
      channel: getEnvVar('AGORA_CHANNEL', false),
      userId: randomUUID()
    }
  },
  artillery: {
    apiKey: getEnvVar('ARTILLERY_API_KEY', false),
  }
};

export {
  config
};
