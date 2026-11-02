import type { SupportedLanguage } from '../i18n';
import {
  readAccountLocale,
  writeAccountLocale,
  type AccountLocaleCache,
} from './accountLocale';
import { profileApi } from './profileApi';

export type AccountLanguageDeps = {
  /** Firebase UID of the account the change belongs to. */
  uid: string;
  getToken: () => Promise<string | null>;
  applyLanguage: (language: SupportedLanguage) => Promise<void>;
};

/**
 * Brings the signed-in account's language in line with the backend. A pending local
 * change for the same account is sent first; the account preference then wins over
 * the device language and the guest choice.
 *
 * @param guestLanguage the language the guest chose explicitly on this device, or
 *   null. It is sent only when the backend creates a new profile.
 * @returns the language now applied for the account, or null when the account has
 *   no preference (the current language is kept).
 */
export async function syncAccountLanguage(
  deps: AccountLanguageDeps & {
    guestLanguage: SupportedLanguage | null;
    /** Username chosen at sign-up; sent only when the backend creates the profile. */
    initialDisplayName?: string | null;
  },
): Promise<SupportedLanguage | null> {
  const token = await deps.getToken();
  if (!token) return null;

  let cache = await readAccountLocale(deps.uid);
  if (cache?.pending) {
    try {
      await profileApi.update(token, { locale: cache.locale });
      cache = { locale: cache.locale, pending: false };
      await writeAccountLocale(deps.uid, cache);
    } catch {
      // Still pending; the next sync for this account retries it.
    }
  }

  if (cache?.pending) {
    await deps.applyLanguage(cache.locale);
    return cache.locale;
  }

  try {
    const profile = await profileApi.provision(
      token,
      deps.guestLanguage,
      deps.initialDisplayName ?? null,
    );
    if (!profile.locale) return null;

    await writeAccountLocale(deps.uid, {
      locale: profile.locale,
      pending: false,
    });
    await deps.applyLanguage(profile.locale);
    return profile.locale;
  } catch {
    // Offline or backend error: fall back to what this account last had, if anything.
    if (cache) await deps.applyLanguage(cache.locale);
    return cache?.locale ?? null;
  }
}

/**
 * Applies a language chosen by the signed-in user. The choice is stored as pending
 * before the request, so it is never reported as saved unless the backend confirms it.
 */
export async function setAccountLanguage(
  deps: AccountLanguageDeps,
  locale: SupportedLanguage,
): Promise<{ saved: boolean }> {
  await deps.applyLanguage(locale);
  const pending: AccountLocaleCache = { locale, pending: true };
  await writeAccountLocale(deps.uid, pending);

  const token = await deps.getToken();
  if (!token) return { saved: false };

  try {
    await profileApi.update(token, { locale });
    await writeAccountLocale(deps.uid, { locale, pending: false });
    return { saved: true };
  } catch {
    return { saved: false };
  }
}
