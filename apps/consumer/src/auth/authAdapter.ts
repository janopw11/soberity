import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebaseInstance';

export type AuthUser = {
  uid: string;
  email: string | null;
};

/** Narrow contract the provider depends on, so tests can replace Firebase. */
export type AuthAdapter = {
  /** Fires on sign-in, sign-out and every ID token refresh. */
  subscribe: (listener: (user: AuthUser | null) => void) => () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns a fresh ID token; the SDK refreshes it when needed. */
  getIdToken: () => Promise<string | null>;
};

export const firebaseAuthAdapter: AuthAdapter = {
  subscribe(listener) {
    return onIdTokenChanged(getFirebaseAuth(), (user) =>
      listener(user ? { uid: user.uid, email: user.email } : null),
    );
  },
  async signUp(email, password) {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  },
  async signIn(email, password) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  },
  async signOut() {
    await firebaseSignOut(getFirebaseAuth());
  },
  async getIdToken() {
    return getFirebaseAuth().currentUser?.getIdToken() ?? null;
  },
};
