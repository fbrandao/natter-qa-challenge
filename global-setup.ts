/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FullConfig } from '@playwright/test';
import { isCI } from './config/env';
import dotenv from 'dotenv';
import path from 'path';

if (!isCI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

async function globalSetup(config: FullConfig) {
  // Global setup logic can go here if needed
}

export default globalSetup; 