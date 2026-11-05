import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { typography, type ColorScheme } from '@soberity/design-tokens';

import { useAuthStatus } from '../auth/AuthStatusContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import { setAccountLanguage } from '../profile/accountLanguage';
import { readAccountLocale } from '../profile/accountLocale';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Screen, SettingsGroup, SettingsRow } from '../ui';
import { EventLocationSettings } from '../events/EventLocationSettings';
import { LanguageSelect } from './LanguageSelect';

type Notice = {
  variant: 'success' | 'danger' | 'warning';
  text: string;
} | null;

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const { user, getIdToken } = useAuthStatus();
  const {
    colors,
    applyLanguage,
    language,
    theme,
    setTheme,
    ready: themeReady,
    error: themeError,
  } = useThemePreferences();

  const [localePending, setLocalePending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    void readAccountLocale(uid).then((cache) =>
      setLocalePending(cache?.pending ?? false),
    );
  }, [uid]);

  const chooseLocale = async (locale: SupportedLanguage) => {
    if (!uid) return;
    setNotice(null);
    const result = await setAccountLanguage(
      { uid, getToken: getIdToken, applyLanguage },
      locale,
    );
    setLocalePending(!result.saved);
    setNotice(
      result.saved
        ? { variant: 'success', text: t('profile.localeSaved') }
        : { variant: 'warning', text: t('profile.localePending') },
    );
  };

  const themeOptions: readonly ColorScheme[] = ['dark', 'light'];
  const languageOptions = SUPPORTED_LANGUAGES.map((locale) => ({
    value: locale,
    label: locale === 'en' ? t('preferences.english') : t('preferences.polish'),
  }));

  return (
    <Screen>
      {notice ? <Alert variant={notice.variant} message={notice.text} /> : null}
      {themeError ? (
        <Alert
          variant="danger"
          title={t('preferences.errorTitle')}
          message={t('preferences.errorMessage')}
        />
      ) : null}

      <SettingsGroup>
        {themeOptions.map((value) => (
          <SettingsRow
            key={value}
            icon={value === 'dark' ? 'moon' : 'sun'}
            label={
              value === 'dark'
                ? t('preferences.darkMode')
                : t('preferences.lightMode')
            }
            selected={theme === value}
            disabled={!themeReady}
            onPress={() => void setTheme(value)}
            testID={`account-theme-${value}`}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon="globe"
          label={t('profile.languageLabel')}
          trailing={
            <LanguageSelect
              label={t('profile.languageLabel')}
              value={language}
              options={languageOptions}
              onChange={(locale) => void chooseLocale(locale)}
              testID="account-language"
            />
          }
        />
      </SettingsGroup>
      <EventLocationSettings />
      {localePending ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.small.fontSize,
            lineHeight: typography.small.lineHeight,
          }}
        >
          {t('profile.localePendingHint')}
        </Text>
      ) : null}
    </Screen>
  );
}
