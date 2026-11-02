import { useTranslation } from 'react-i18next';
import { Image, StyleSheet } from 'react-native';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
const LOGO_LIGHT = require('../../assets/images/soberity-logo.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
const LOGO_DARK = require('../../assets/images/soberity-logo-dark.png');

/** Soberity wordmark with the brain mark; the dark theme uses a light wordmark. */
export function AppLogo() {
  const { t } = useTranslation();
  const { theme } = useThemePreferences();

  return (
    <Image
      source={theme === 'dark' ? LOGO_DARK : LOGO_LIGHT}
      style={styles.logo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 75, height: 24 },
});
