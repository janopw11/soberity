import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@soberity/design-tokens';

import { EmptyState, Screen } from './ui';

type Props = { title: string; description: string };

/** Generic placeholder for planned areas that are not implemented yet. */
export default function UnavailableScreen({ title, description }: Props) {
  const { t } = useTranslation();

  return (
    <Screen>
      <EmptyState
        eyebrow={t('common.notAvailableYetBadge')}
        title={title}
        description={description}
      >
        <Text style={styles.body}>{t('common.previewNotice')}</Text>
        <Link href="/" dismissTo style={styles.link}>
          {t('common.backToWelcome')} →
        </Link>
      </EmptyState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
    textDecorationLine: 'underline',
    paddingVertical: 16,
    minHeight: 48,
  },
});
