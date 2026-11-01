/**
 * Public Firebase client configuration. EXPO_PUBLIC_* values are bundled into
 * the app, so they must never contain service credentials.
 *
 * Expo inlines only literal `process.env.EXPO_PUBLIC_*` accesses, so each
 * variable is read explicitly.
 */
export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export class AuthNotConfiguredError extends Error {
  readonly code = 'auth/not-configured';

  constructor() {
    super('Firebase Auth is not configured for this build.');
    this.name = 'AuthNotConfiguredError';
  }
}

export function readFirebaseClientConfig(): FirebaseClientConfig {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.appId
  ) {
    throw new AuthNotConfiguredError();
  }

  return config as FirebaseClientConfig;
}

/** Backend base URL, without a trailing slash, e.g. http://localhost:8080. */
export function readBackendApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL is not set.');
  }
  return url.replace(/\/+$/, '');
}

/**
 * Optional local Auth emulator, e.g. http://localhost:9099 on web/iOS or
 * http://10.0.2.2:9099 on the Android emulator.
 */
export function readAuthEmulatorUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || undefined;
}
