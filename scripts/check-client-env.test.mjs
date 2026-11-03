import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStagingClientEnv } from './check-client-env.mjs';

const env = {
  EXPO_PUBLIC_API_URL: 'https://staging.example.org',
  EXPO_PUBLIC_FIREBASE_API_KEY: 'synthetic-public-client-value',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'staging.example.org',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'soberity-staging-test',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'synthetic-app-id',
};
test('accepts complete HTTPS preview configuration', () => {
  assert.doesNotThrow(() => validateStagingClientEnv(env));
});
test('rejects missing configuration before making a guest-only preview', () => {
  for (const name of Object.keys(env))
    assert.throws(() => validateStagingClientEnv({ ...env, [name]: '' }));
});
test('rejects local HTTP, embedded credentials, demo Firebase and emulator previews', () => {
  for (const patch of [
    { EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080' },
    { EXPO_PUBLIC_API_URL: 'https://localhost' },
    { EXPO_PUBLIC_API_URL: 'https://user:password@staging.example.org' },
    { EXPO_PUBLIC_API_URL: 'https://staging.example.org?token=synthetic' },
    { EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-soberity' },
    { EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099' },
  ])
    assert.throws(() => validateStagingClientEnv({ ...env, ...patch }));
});
