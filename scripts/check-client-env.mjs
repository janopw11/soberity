import { pathToFileURL } from 'node:url';

export function validateStagingClientEnv(env) {
  const required = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];
  if (required.some((name) => !env[name]?.trim()))
    throw new Error('Missing staging client configuration.');
  const api = new URL(env.EXPO_PUBLIC_API_URL);
  if (
    api.protocol !== 'https:' ||
    api.username ||
    api.password ||
    api.search ||
    api.hash ||
    api.pathname !== '/' ||
    ['localhost', '127.0.0.1', '[::1]', '10.0.2.2'].includes(api.hostname) ||
    env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ||
    env.EXPO_PUBLIC_FIREBASE_PROJECT_ID.startsWith('demo-')
  ) {
    throw new Error(
      'Preview requires HTTPS staging API and real staging Firebase without an emulator.',
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (
    process.argv.includes('--required') ||
    process.env.EAS_BUILD_PROFILE?.startsWith('preview')
  ) {
    try {
      validateStagingClientEnv(process.env);
      console.log('PASS: required staging client configuration present.');
    } catch {
      console.error(
        'Missing or unsafe staging client configuration; check public API/Firebase values without printing credentials.',
      );
      process.exitCode = 1;
    }
  }
}
