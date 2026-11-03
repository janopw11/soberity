import { defineConfig } from '@playwright/test';
import base from './playwright.config';
const config = { ...base, testDir: './tests/blog', timeout: 60000 };
if (process.env.BLOG_PREVIEW_URL) {
  delete config.webServer;
  config.use = { ...config.use, baseURL: process.env.BLOG_PREVIEW_URL };
}
export default defineConfig(config);
