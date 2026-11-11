import { useState } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { radii, spacing } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import SideMenu from '../SideMenu';
import { SettingsIcon } from '../ui';

function HeaderMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { category } = useGlobalSearchParams<{ category?: string }>();
  const inQuizCategory = pathname === '/science/quizzes' && Boolean(category);
  const inEvents = pathname === '/events' || pathname === '/events/';
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.leftActions}>
      <SideMenu />
      {inEvents || inQuizCategory || (pathname !== '/' && router.canGoBack()) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('navigation.goBack')}
          onPress={() => {
            if (inEvents) router.replace('/');
            else if (inQuizCategory) router.setParams({ category: undefined });
            else router.back();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.iconButton, { borderColor: focused ? colors.focusRing : 'transparent' }]}
        >
          <View style={styles.backIcon}>
            <SettingsIcon name="chevron" size={24} color={colors.textPrimary} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function HeaderProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('navigation.openAccount')}
      onPress={() => { if (pathname !== '/account') router.navigate('/account'); }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.iconButton, { borderColor: focused ? colors.focusRing : 'transparent' }]}
    >
      <Image
        source={theme === 'dark'
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
          ? require('../../assets/images/profile-icon-ocean-dark.png')
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
          : require('../../assets/images/profile-icon-ocean-light.png')}
        style={styles.accountIcon}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

/** Same member controls and theme on every stack, while guest/auth guards stay intact. */
export function useAppHeaderOptions() {
  const { status } = useAuthStatus();
  const { colors } = useThemePreferences();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.textPrimary,
    contentStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    ...(status === 'authenticated' ? {
      headerLeft: () => <HeaderMenu />,
      headerRight: () => <HeaderProfile />,
      headerBackVisible: false,
    } : {}),
  };
}

const styles = StyleSheet.create({
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 2,
  },
  accountIcon: { width: 26, height: 26, marginHorizontal: spacing.space8 },
  backIcon: { transform: [{ rotate: '180deg' }] },
});
