import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SupportedLanguage } from '../i18n';

/**
 * Language last chosen or loaded for one account. `pending` means the user changed it
 * locally but the backend has not confirmed the change yet.
 */
export type AccountLocaleCache = {
  locale: SupportedLanguage;
  pending: boolean;
};

const KEY_PREFIX = '@soberity/account/';

/**
 * Keys are per Firebase UID, so a cached value or a pending write from one account
 * is never read or sent for another account on the same device.
 */
function storageKey(uid: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(uid)}/locale`;
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'en' || value === 'pl';
}

export async function readAccountLocale(
  uid: string,
): Promise<AccountLocaleCache | null> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      isSupportedLanguage((parsed as { locale?: unknown }).locale) &&
      typeof (parsed as { pending?: unknown }).pending === 'boolean'
    ) {
      return parsed as AccountLocaleCache;
    }
  } catch {
    // A corrupted entry is ignored; the profile from the backend is used instead.
  }
  return null;
}

export async function writeAccountLocale(
  uid: string,
  value: AccountLocaleCache,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(value));
}
