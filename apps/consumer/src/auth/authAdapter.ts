import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onIdTokenChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
  type ActionCodeSettings,
} from 'firebase/auth';

import {
  readEmailVerificationContinueUrl,
  readPasswordResetContinueUrl,
} from './config';
import { getFirebaseAuth } from './firebaseInstance';

/** Firebase reports this only when email enumeration protection is disabled. */
const USER_NOT_FOUND = 'auth/user-not-found';

function actionCodeSettings(
  url: string | undefined,
): ActionCodeSettings | undefined {
  return url ? { url, handleCodeInApp: true } : undefined;
}

export type AuthUser = {
  uid: string;
  email: string | null;
  /** Username chosen at sign-up; the backend copy is created on the first verified sign-in. */
  displayName: string | null;
};

/** Narrow contract the provider depends on, so tests can replace Firebase. */
export type AuthAdapter = {
  /** Fires on sign-in, sign-out and every ID token refresh. */
  subscribe: (listener: (user: AuthUser | null) => void) => () => void;
  signUp: (
    email: string,
    password: string,
    displayName: string | null,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  reload: () => Promise<void>;
  applyEmailVerificationAction: (oobCode: string) => Promise<void>;
  /** Resolves the same way for unknown addresses, so the UI cannot reveal accounts. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Validates a reset code and returns the account e-mail it belongs to. */
  checkPasswordResetCode: (oobCode: string) => Promise<string>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  /** Re-checks the password of the signed-in account before a sensitive change (recent login). */
  reauthenticate: (currentPassword: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  /** Sends a verification link to the new address; the e-mail changes only after it is opened. */
  verifyNewEmail: (newEmail: string) => Promise<void>;
  /** Removes the Firebase account of the signed-in user. */
  deleteUser: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns a fresh ID token; the SDK refreshes it when needed. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

export const firebaseAuthAdapter: AuthAdapter = {
  subscribe(listener) {
    return onIdTokenChanged(getFirebaseAuth(), (user) =>
      listener(
        user
          ? { uid: user.uid, email: user.email, displayName: user.displayName }
          : null,
      ),
    );
  },
  async signUp(email, password, displayName) {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    await sendEmailVerification(
      credential.user,
      actionCodeSettings(readEmailVerificationContinueUrl()),
    );
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
    await sendEmailVerification(
      user,
      actionCodeSettings(readEmailVerificationContinueUrl()),
    );
  },
  async reload() {
    const user = getFirebaseAuth().currentUser;
    if (user) await reload(user);
  },
  async applyEmailVerificationAction(oobCode) {
    await applyActionCode(getFirebaseAuth(), oobCode);
  },
  async requestPasswordReset(email) {
    try {
      await sendPasswordResetEmail(
        getFirebaseAuth(),
        email,
        actionCodeSettings(readPasswordResetContinueUrl()),
      );
    } catch (error) {
      if (!isFirebaseCode(error, USER_NOT_FOUND)) throw error;
    }
  },
  async checkPasswordResetCode(oobCode) {
    return verifyPasswordResetCode(getFirebaseAuth(), oobCode);
  },
  async confirmPasswordReset(oobCode, newPassword) {
    await confirmPasswordReset(getFirebaseAuth(), oobCode, newPassword);
  },
  async reauthenticate(currentPassword) {
    const user = currentUser();
    if (!user.email) throw new Error('The account has no e-mail address.');
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, currentPassword),
    );
  },
  async updatePassword(newPassword) {
    await updatePassword(currentUser(), newPassword);
  },
  async verifyNewEmail(newEmail) {
    await verifyBeforeUpdateEmail(currentUser(), newEmail);
  },
  async deleteUser() {
    await deleteUser(currentUser());
  },
  async signOut() {
    await firebaseSignOut(getFirebaseAuth());
  },
  async getIdToken(forceRefresh = false) {
    return getFirebaseAuth().currentUser?.getIdToken(forceRefresh) ?? null;
  },
};

function isFirebaseCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function currentUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('No signed-in user.');
  return user;
}
