import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/web',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8091', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-web',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command:
      'pnpm exec expo start --web --clear --port 8091 --localhost --max-workers 2',
    env: { CI: '1' },
    url: 'http://127.0.0.1:8091',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
