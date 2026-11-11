import { defineConfig } from '@playwright/test';
import base from './playwright.events.config';
export default defineConfig({
  ...base,
  testMatch: 'map-clusters.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:8093' },
  webServer: {
    ...base.webServer,
    command:
      'pnpm exec expo start --web --clear --port 8093 --localhost --max-workers 2',
    env: {
      ...(base.webServer as { env: Record<string, string> }).env,
      EXPO_PUBLIC_GEOAPIFY_API_KEY: 'map-test-only',
    },
    url: 'http://127.0.0.1:8093',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
