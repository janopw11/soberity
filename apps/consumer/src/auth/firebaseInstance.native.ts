import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import { readAuthEmulatorUrl, readFirebaseClientConfig } from './config';

let cachedAuth: Auth | null = null;

/** Native persists the session in AsyncStorage, as the web build cannot use the RN persistence. */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app =
    getApps().length > 0 ? getApp() : initializeApp(readFirebaseClientConfig());

  let auth: Auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (e.g. after Fast Refresh): reuse the existing instance.
    auth = getAuth(app);
  }

  const emulatorUrl = readAuthEmulatorUrl();
  if (emulatorUrl) {
    connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  }

  cachedAuth = auth;
  return auth;
}
