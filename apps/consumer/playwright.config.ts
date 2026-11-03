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
    env: {
      CI: '1',
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:8080',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-soberity',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:test-only',
      EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
    },
    url: 'http://127.0.0.1:8091',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
