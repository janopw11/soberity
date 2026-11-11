import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../../src/ui';
import { Image, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';
import { navigationItems } from '../../src/navigation';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function AuthenticatedLayout() {
  const { t } = useTranslation();
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: t('common.appName'),
          headerTitle: () => <AppLogo />,
        }}
      />
      <Stack.Screen
        name="editorial-events"
        options={{ title: t('eventEditor.title') }}
      />
      <Stack.Screen
        name="editorial-weekly"
        options={{ title: t('weekly.editorTitle') }}
      />
      <Stack.Screen
        name="editorial-quizzes"
        options={{ title: t('learning.editor.title') }}
      />
      <Stack.Screen
        name="editorial-evidence"
        options={{ title: t('editorial.evidence') }}
      />
      <Stack.Screen
        name="editorial"
        options={{ title: t('editorial.title') }}
      />
      <Stack.Screen
        name="about"
        options={{ title: t('about.title'), headerTitle: () => <AboutTitle /> }}
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
        name="account-going"
        options={{ title: t('events.going.profileTitle') }}
      />
      <Stack.Screen
        name="account-preferences"
        options={{ title: t('account.sections.preferences') }}
      />
    </Stack>
  );
}

function AboutTitle() {
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  const aboutItem = navigationItems.find((item) => item.id === 'about')!;
  return (
    <View style={styles.aboutTitle}>
      <Image
        source={theme === 'dark' ? aboutItem.imageDark : aboutItem.image}
        style={styles.aboutIcon}
        resizeMode="contain"
        accessible={false}
        importantForAccessibility="no"
        accessibilityIgnoresInvertColors
      />
      <Text
        accessibilityRole="header"
        style={[styles.aboutLabel, { color: colors.primary }]}
      >
        {t('about.title')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  aboutTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
  },
  aboutIcon: { width: 32, height: 32 },
  aboutLabel: { ...typography.h3, flexShrink: 1 },
});
