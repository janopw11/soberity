import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

import { readAuthEmulatorUrl, readFirebaseClientConfig } from './config';

let cachedAuth: Auth | null = null;

/** Web keeps the SDK default persistence (IndexedDB with local storage fallback). */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app =
    getApps().length > 0 ? getApp() : initializeApp(readFirebaseClientConfig());
  const auth = getAuth(app);

  const emulatorUrl = readAuthEmulatorUrl();
  if (emulatorUrl) {
    connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  }

  cachedAuth = auth;
  return auth;
}
