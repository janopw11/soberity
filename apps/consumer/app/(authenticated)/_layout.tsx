import { router, Stack } from 'expo-router';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radii, spacing } from '@soberity/design-tokens';

import SideMenu from '../../src/SideMenu';
import { AppLogo } from '../../src/ui';
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
      <Stack.Screen
        name="index"
        options={{
          title: t('common.appName'),
          headerTitle: () => <AppLogo />,
          headerLeft: () => <SideMenu />,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('navigation.openAccount')}
              onPress={() => router.push('/account')}
              style={styles.accountButton}
            >
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
                source={require('../../assets/images/profile-icon.png')}
                style={styles.accountIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                accessible={false}
                importantForAccessibility="no"
              />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="account" options={{ title: t('account.title') }} />
      <Stack.Screen
        name="account-personal-data"
        options={{ title: t('account.sections.personalData') }}
      />
      <Stack.Screen
        name="account-password"
        options={{ title: t('account.sections.password') }}
      />
      <Stack.Screen
        name="account-preferences"
        options={{ title: t('account.sections.preferences') }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  accountButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  accountIcon: {
    width: 32,
    height: 32,
    marginHorizontal: spacing.space8,
  },
});
