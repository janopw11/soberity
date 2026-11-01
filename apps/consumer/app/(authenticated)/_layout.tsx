import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';

export default function AuthenticatedLayout() {
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
      <Stack.Screen name="account" options={{ title: t('account.title') }} />
    </Stack>
  );
}
