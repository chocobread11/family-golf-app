import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), true);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.GOLF_TEST_URL ?? 'http://127.0.0.1:3000',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
