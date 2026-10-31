import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors } from '@soberity/design-tokens';

export default function AuthenticatedLayout() {
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
      <Stack.Screen name="account" options={{ title: t('account.title') }} />
    </Stack>
  );
}
