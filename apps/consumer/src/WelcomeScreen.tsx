import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { Button, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/** Guest landing; `signedIn` renders the same Main page without auth prompts. */
export default function WelcomeScreen({
  signedIn = false,
}: {
  signedIn?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('welcome.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('welcome.title')}
      </Text>
      <Text style={styles.intro}>{t('welcome.intro')}</Text>

      {signedIn ? null : (
        <>
          <View style={styles.actions}>
            <Button
              label={t('welcome.signInButton')}
              onPress={() => router.push('/sign-in')}
              testID="welcome-sign-in"
            />
            <Button
              label={t('welcome.signUpButton')}
              variant="secondary"
              onPress={() => router.push('/sign-up')}
              testID="welcome-sign-up"
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>{t('welcome.previewTitle')}</Text>
            <Text style={styles.body}>{t('welcome.previewBody')}</Text>
          </View>
        </>
      )}

      <Text style={styles.footer}>{t('welcome.footer')}</Text>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    eyebrow: {
      color: colors.textSecondary,
      fontSize: typography.label.fontSize,
      fontWeight: typography.label.fontWeight,
      letterSpacing: 1.5,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.display.fontSize,
      lineHeight: typography.display.lineHeight,
      fontWeight: typography.display.fontWeight,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: typography.h3.fontSize,
      lineHeight: typography.h3.lineHeight + 4,
      maxWidth: 640,
    },
    actions: {
      gap: spacing.space12,
      maxWidth: 420,
    },
    notice: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.lg,
      padding: spacing.space16,
      gap: spacing.space8,
    },
    noticeTitle: {
      color: colors.textPrimary,
      fontSize: typography.bodyStrong.fontSize,
      fontWeight: typography.bodyStrong.fontWeight,
    },
    body: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    footer: {
      color: colors.textSecondary,
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
    },
  });
}
