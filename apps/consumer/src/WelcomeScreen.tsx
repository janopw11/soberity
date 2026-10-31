import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@soberity/design-tokens';

import { Screen } from './ui';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('welcome.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('welcome.title')}
      </Text>
      <Text style={styles.intro}>{t('welcome.intro')}</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>{t('welcome.previewTitle')}</Text>
        <Text style={styles.body}>{t('welcome.previewBody')}</Text>
      </View>

      <View style={styles.cards}>
        <Link href="/science" asChild>
          <Pressable style={styles.card} accessibilityRole="link">
            <Text style={styles.cardLabel}>
              {t('welcome.scienceCardLabel')}
            </Text>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              {t('welcome.scienceCardTitle')}
            </Text>
            <Text style={styles.body}>{t('welcome.scienceCardBody')}</Text>
            <Text style={styles.cardLink}>
              {t('welcome.scienceCardLink')} →
            </Text>
          </Pressable>
        </Link>
        <Link href="/events" asChild>
          <Pressable style={styles.card} accessibilityRole="link">
            <Text style={styles.cardLabel}>{t('welcome.eventsCardLabel')}</Text>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              {t('welcome.eventsCardTitle')}
            </Text>
            <Text style={styles.body}>{t('welcome.eventsCardBody')}</Text>
            <Text style={styles.cardLink}>{t('welcome.eventsCardLink')} →</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/account" style={styles.account}>
        {t('welcome.accountLink')} →
      </Link>
      <Text style={styles.footer}>{t('welcome.footer')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space16 },
  card: {
    flexGrow: 1,
    flexBasis: 300,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.space24,
    gap: spacing.space16,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    letterSpacing: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: typography.h2.fontWeight,
  },
  cardLink: {
    color: colors.primary,
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    paddingVertical: spacing.space8,
  },
  account: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.space12,
    minHeight: 48,
    textDecorationLine: 'underline',
  },
  footer: {
    color: colors.textSecondary,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
  },
});
