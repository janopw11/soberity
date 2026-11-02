import { useEffect, useRef } from 'react';

import { useAuthStatus } from '../auth/AuthStatusContext';
import {
  readGuestLanguageChoice,
  useThemePreferences,
} from '../preferences/ThemePreferencesContext';
import { resolveDeviceLanguage } from '../i18n';
import { syncAccountLanguage } from './accountLanguage';

/**
 * Keeps the UI language in line with the signed-in account. After sign-in the account's
 * language is loaded; after sign-out the guest choice (or device language) is restored,
 * so an account's language never stays on the device for the next user.
 */
export function useAccountLanguageSync() {
  const { status, user, getIdToken } = useAuthStatus();
  const { applyLanguage } = useThemePreferences();
  const uid = user?.uid ?? null;
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && uid) {
      wasAuthenticated.current = true;
      void (async () => {
        const guestLanguage = await readGuestLanguageChoice();
        await syncAccountLanguage({
          uid,
          getToken: getIdToken,
          applyLanguage,
          guestLanguage,
        });
      })();
      return;
    }

    if (wasAuthenticated.current && status === 'guest') {
      wasAuthenticated.current = false;
      void (async () => {
        const guestLanguage =
          (await readGuestLanguageChoice()) ?? resolveDeviceLanguage();
        await applyLanguage(guestLanguage);
      })();
    }
  }, [status, uid, getIdToken, applyLanguage]);
}
