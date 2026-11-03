import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '../../src/ui';
import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';

export default function PublicLayout() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('common.appName'), headerTitle: () => <AppLogo /> }}
      />
      <Stack.Screen name="events" options={{ title: t('events.title') }} />
      <Stack.Screen name="sign-in" options={{ title: t('auth.signInTitle') }} />
      <Stack.Screen name="sign-up" options={{ title: t('auth.signUpTitle') }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: t('forgotPassword.title') }}
      />
    </Stack>
  );
}
