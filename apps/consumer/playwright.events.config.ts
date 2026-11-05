import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testDir: './tests/events',
  timeout: 45000,
  use: { ...base.use, timezoneId: 'Europe/Vienna', reducedMotion: 'reduce' },
});
