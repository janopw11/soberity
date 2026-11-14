import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppLogo, SettingsIcon } from '../../src/ui';
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
        name="circles/index"
        options={{
          title: t('circles.title'),
          headerTitle: () => <CirclesTitle />,
        }}
      />
      <Stack.Screen
        name="circles/[id]"
        options={{ title: t('circles.title') }}
      />
      <Stack.Screen
        name="editorial-circles"
        options={{ title: t('circles.admin') }}
      />
      <Stack.Screen
        name="editorial-discussions"
        options={{ title: t('discussions.admin') }}
      />
      <Stack.Screen
        name="community"
        options={{
          title: t('community.title'),
          headerTitle: () => <SectionTitle section="community" />,
        }}
      />
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
        options={{
          title: t('about.title'),
          headerTitle: () => <SectionTitle section="about" />,
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

function CirclesTitle() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <View style={styles.aboutTitle}>
      <SettingsIcon name="people" color={colors.primary} size={28} />
      <Text
        accessibilityRole="header"
        style={[styles.aboutLabel, { color: colors.primary }]}
      >
        {t('circles.title')}
      </Text>
    </View>
  );
}

function SectionTitle({ section }: { section: 'about' | 'community' }) {
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  const aboutItem =
    section === 'community'
      ? navigationItems.find((item) => item.id === 'community')!
      : navigationItems.find((item) => item.id === 'about')!;
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
        {t(`${section}.title`)}
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
