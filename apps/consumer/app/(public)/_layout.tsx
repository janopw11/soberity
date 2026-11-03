import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppLogo } from '../../src/ui';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function PublicLayout() {
  const { t } = useTranslation();
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="index"
        options={{ title: t('common.appName'), headerTitle: () => <AppLogo /> }}
      />
      <Stack.Screen name="sign-in" options={{ title: t('auth.signInTitle') }} />
      <Stack.Screen name="sign-up" options={{ title: t('auth.signUpTitle') }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: t('forgotPassword.title') }}
      />
    </Stack>
  );
}
