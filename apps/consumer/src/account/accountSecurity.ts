import AsyncStorage from '@react-native-async-storage/async-storage';

import { removeAccountLocale } from '../profile/accountLocale';

export type AccountSecurityDeps = {
  /** Firebase UID of the account the operation belongs to. */
  uid: string;
  getToken: () => Promise<string | null>;
  reauthenticate: (currentPassword: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteUser: () => Promise<void>;
  /** Deletes the application data on the backend (idempotent). */
  deleteBackendData: (idToken: string) => Promise<void>;
};

const KEY_PREFIX = '@soberity/account/';

function deletionKey(uid: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(uid)}/deletion`;
}

/** True when an earlier deletion started but the Firebase account was not removed yet. */
export async function hasPendingDeletion(uid: string): Promise<boolean> {
  return (await AsyncStorage.getItem(deletionKey(uid))) === 'pending';
}

/** Every sensitive change re-checks the current password first; nothing changes if that check fails. */
export async function changePassword(
  deps: AccountSecurityDeps,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await deps.reauthenticate(currentPassword);
  await deps.updatePassword(newPassword);
}

/**
 * Deletes the account in a fixed order: re-check password, mark the deletion as
 * pending, delete the backend data, then delete the Firebase account. A failure
 * after the first step leaves the pending marker, so calling this again resumes the
 * deletion instead of leaving a half-deleted account without a way to finish it.
 */
export async function deleteAccount(
  deps: AccountSecurityDeps,
  currentPassword: string,
): Promise<void> {
  await deps.reauthenticate(currentPassword);
  await AsyncStorage.setItem(deletionKey(deps.uid), 'pending');

  const token = await deps.getToken();
  if (!token) throw new Error('No signed-in user.');
  await deps.deleteBackendData(token);
  await deps.deleteUser();

  await AsyncStorage.removeItem(deletionKey(deps.uid));
  await removeAccountLocale(deps.uid);
}
