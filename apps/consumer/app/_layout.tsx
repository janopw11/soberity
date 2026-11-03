import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import '../src/i18n';
import {
  AuthStatusProvider,
  useAuthStatus,
} from '../src/auth/AuthStatusContext';
import { useAccountLanguageSync } from '../src/profile/useAccountLanguage';
import OfflineScreen from '../src/OfflineScreen';
import {
  ThemePreferencesProvider,
  useThemePreferences,
} from '../src/preferences/ThemePreferencesContext';
import { LoadingState } from '../src/ui';

/**
 * Guards the top-level route groups against the current auth status. Routes
 * are not rendered while the initial session check is running. The offline
 * screen replaces the stack when the backend cannot confirm a session.
 */
function RootNavigator() {
  const { status } = useAuthStatus();
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  useAccountLanguageSync();

  if (status === 'loading') {
    return <LoadingState label={t('auth.checkingSession')} />;
  }

  if (status === 'offline') {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <OfflineScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Protected guard={status === 'guest'}>
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'verification-pending'}>
          <Stack.Screen
            name="verification-pending"
            options={{ title: t('verificationPending.title') }}
          />
        </Stack.Protected>
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen
            name="(authenticated)"
            options={{ headerShown: false }}
          />
        </Stack.Protected>
        <Stack.Screen name="science" options={{ headerShown: false }} />
        <Stack.Screen
          name="+not-found"
          options={{ title: t('notFound.title') }}
        />
        <Stack.Screen
          name="verify-email"
          options={{ title: t('verificationAction.title') }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ title: t('resetPassword.title') }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferencesProvider>
      <AuthStatusProvider>
        <RootNavigator />
      </AuthStatusProvider>
    </ThemePreferencesProvider>
  );
}
