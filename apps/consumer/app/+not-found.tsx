import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@soberity/design-tokens';

export default function NotFoundRoute() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('notFound.title')}
      </Text>
      <Link href="/" replace style={styles.link}>
        {t('notFound.link')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.space24,
    gap: spacing.space24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    fontWeight: typography.h1.fontWeight,
    color: colors.textPrimary,
  },
  link: {
    padding: spacing.space16,
    minHeight: 48,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
