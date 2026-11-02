import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';

import { Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { ArticleIllustration } from './news/ArticleIllustration';
import { previewArticles } from './news/previewArticles';

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { width, fontScale } = useWindowDimensions();
  const styles = createStyles(colors);
  const thumbnailSize = width < 380 ? 80 : width < 600 ? 96 : 112;
  const showIllustrations = width >= 340 && fontScale < 1.6;
  const dateFormat = new Intl.DateTimeFormat(
    i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB',
    {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    },
  );

  return (
    <Screen maxWidth={800}>
      <View style={styles.welcome}>
        <Text accessibilityRole="header" style={styles.welcomeTitle}>
          {t('home.welcome')}
        </Text>
      </View>

      <View>
        <View style={styles.feedHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('home.latest')}
          </Text>
        </View>
        {previewArticles.map((article) => (
          <View
            key={article.id}
            style={styles.article}
            testID={`news-${article.id}`}
          >
            <View style={styles.byline}>
              <View accessible={false} style={styles.editorMark}>
                <Text style={styles.editorInitial}>S</Text>
              </View>
              <Text style={styles.meta}>
                {t('home.editorial')} ·{' '}
                {dateFormat.format(new Date(`${article.date}T12:00:00Z`))}
              </Text>
            </View>
            <View style={styles.articleBody}>
              <View style={styles.articleText}>
                <Text accessibilityRole="header" style={styles.articleTitle}>
                  {t(`home.stories.${article.id}.title`)}
                </Text>
                <Text style={styles.body}>
                  {t(`home.stories.${article.id}.summary`)}
                </Text>
              </View>
              {showIllustrations ? (
                <View
                  style={styles.illustration}
                  importantForAccessibility="no-hide-descendants"
                >
                  <ArticleIllustration
                    topic={article.id}
                    size={thumbnailSize}
                  />
                </View>
              ) : null}
            </View>
            <Text style={styles.meta}>
              {t(`home.kinds.${article.kind}`)} ·{' '}
              {t('home.readTime', { count: article.minutes })}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>{t('welcome.footer')}</Text>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    welcome: { gap: spacing.space8, paddingTop: spacing.space16 },
    welcomeTitle: { ...typography.h2, color: colors.primary },
    body: { ...typography.body, color: colors.textSecondary },
    feedHeader: {
      gap: spacing.space8,
      paddingBottom: spacing.space24,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sectionTitle: { ...typography.h3, color: colors.primary },
    article: {
      gap: spacing.space16,
      paddingVertical: spacing.space24,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    byline: { flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
    editorMark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editorInitial: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    meta: { ...typography.small, color: colors.textMuted, flexShrink: 1 },
    articleBody: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.space16,
    },
    articleText: { flex: 1, minWidth: 0, gap: spacing.space8 },
    articleTitle: { ...typography.h3, color: colors.textPrimary },
    illustration: { flexShrink: 0, paddingTop: spacing.space4 },
    footer: {
      ...typography.small,
      color: colors.textMuted,
      paddingBottom: spacing.space16,
    },
  });
}
