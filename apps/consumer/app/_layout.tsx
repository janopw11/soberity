import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { colors } from '@soberity/design-tokens';

import '../src/i18n';
import {
  AuthStatusProvider,
  useAuthStatus,
} from '../src/auth/AuthStatusContext';

/**
 * Guards the three top-level route groups against the current auth status.
 * `guest` is the only reachable status until real sign-in/session handling
 * lands in P0-I05/P0-I06; `verification-pending` and `(authenticated)` are
 * reserved here so later iterations can flip the guard without a reroute.
 */
function RootNavigator() {
  const { status } = useAuthStatus();
  const { t } = useTranslation();

  return (
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
        <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen
        name="+not-found"
        options={{ title: t('notFound.title') }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthStatusProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthStatusProvider>
  );
}
