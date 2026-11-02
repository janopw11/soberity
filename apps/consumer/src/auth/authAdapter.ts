import {
  applyActionCode,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type ActionCodeSettings,
} from 'firebase/auth';

import { readEmailVerificationContinueUrl } from './config';
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
  sendEmailVerification: () => Promise<void>;
  reload: () => Promise<void>;
  applyEmailVerificationAction: (oobCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns a fresh ID token; the SDK refreshes it when needed. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

export const firebaseAuthAdapter: AuthAdapter = {
  subscribe(listener) {
    return onIdTokenChanged(getFirebaseAuth(), (user) =>
      listener(user ? { uid: user.uid, email: user.email } : null),
    );
  },
  async signUp(email, password) {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    const continueUrl = readEmailVerificationContinueUrl();
    const actionCodeSettings: ActionCodeSettings | undefined = continueUrl
      ? { url: continueUrl, handleCodeInApp: true }
      : undefined;
    await sendEmailVerification(credential.user, actionCodeSettings);
  },
  async signIn(email, password) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  },
  async sendEmailVerification() {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw new Error(
        'Cannot send verification email without a signed-in user.',
      );
    }
    const continueUrl = readEmailVerificationContinueUrl();
    const actionCodeSettings: ActionCodeSettings | undefined = continueUrl
      ? { url: continueUrl, handleCodeInApp: true }
      : undefined;
    await sendEmailVerification(user, actionCodeSettings);
  },
  async reload() {
    const user = getFirebaseAuth().currentUser;
    if (user) await reload(user);
  },
  async applyEmailVerificationAction(oobCode) {
    await applyActionCode(getFirebaseAuth(), oobCode);
  },
  async signOut() {
    await firebaseSignOut(getFirebaseAuth());
  },
  async getIdToken(forceRefresh = false) {
    return getFirebaseAuth().currentUser?.getIdToken(forceRefresh) ?? null;
  },
};
