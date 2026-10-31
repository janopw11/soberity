import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors } from '@soberity/design-tokens';

import SideMenu from '../../src/SideMenu';

export default function PublicLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackVisible: false,
        headerLeft: () => <SideMenu />,
      }}
    >
      <Stack.Screen name="index" options={{ title: t('common.appName') }} />
      <Stack.Screen name="science" options={{ title: t('science.title') }} />
      <Stack.Screen name="events" options={{ title: t('events.title') }} />
    </Stack>
  );
}
