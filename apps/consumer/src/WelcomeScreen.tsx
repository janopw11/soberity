import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';

import { Button, Screen, SettingsIcon } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { ArticleIllustration } from './news/ArticleIllustration';
import { previewArticles } from './news/previewArticles';

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { width, fontScale } = useWindowDimensions();
  const imageHeight = Math.min(180, Math.max(150, width * 0.45));
  const styles = createStyles(colors, imageHeight);
  const thumbnailSize = width < 380 ? 80 : width < 600 ? 96 : 112;
  const showIllustrations = width >= 340 && fontScale < 1.6;
  const dateFormat = new Intl.DateTimeFormat(
    i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short', timeZone: 'UTC' },
  );

  return (
    <Screen maxWidth={800}>
      <View style={styles.welcomeBlock}>
        <Text accessibilityRole="header" style={styles.welcomeTitle}>
          {t('home.missionHeadline')}
        </Text>
        <Text style={styles.welcomeSubtitle}>{t('home.missionSubtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('home.todaysSpotlight')}
        </Text>
        <Pressable
          style={[styles.tile, styles.featureCard]}
          accessibilityRole="button"
          accessibilityLabel={`${t('home.worldMapStatsTitle')}. ${t('home.openSection')}`}
          accessibilityHint={t('home.previewOnlyHint')}
          accessibilityState={{ disabled: true }}
          testID="home-for-you-today"
        >
          <Image
            source={require('../assets/images/world-map-realistic.png')}
            style={styles.cardImage}
            resizeMode="cover"
            fadeDuration={0}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <View style={styles.featureContent} pointerEvents="none">
            <Text style={styles.featureCategory}>
              {t('home.interactiveDiscovery')}
            </Text>
            <View style={styles.featureTitleRow}>
              <Text accessibilityRole="header" style={styles.featureTitle}>
                {t('home.worldMapStatsTitle')}
              </Text>
              <SettingsIcon name="chevron" color={colors.textMuted} size={20} />
            </View>
            <Text style={styles.featureDescription}>
              {t('home.worldMapStats')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('home.eventsNearYou')}
        </Text>
        <Text style={styles.eventsEmpty}>{t('home.eventsNotAvailable')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {t('home.latest')}
          </Text>
        </View>
        <View style={styles.newsList} testID="home-latest-news">
          {previewArticles.slice(0, 2).map((article, index) => (
            <View
              key={article.id}
              style={[
                styles.tile,
                styles.articleTile,
                index === 0 && styles.featuredTile,
              ]}
              testID={`news-${article.id}`}
            >
              <View style={styles.byline}>
                <View style={styles.editorMark}>
                  <Text style={styles.editorInitial}>S</Text>
                </View>
                <Text style={styles.meta}>{t('home.editorial')}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.meta}>
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
              <View style={styles.articleFooter}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>
                    {t(`home.kinds.${article.kind}`)}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {t('home.readTime', { count: article.minutes })}
                </Text>
              </View>
            </View>
          ))}
          <Button
            label={t('home.goToNews')}
            variant="secondary"
            disabled
            testID="home-go-to-news"
          />
        </View>
      </View>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
  imageHeight: number,
) {
  return StyleSheet.create({
    welcomeBlock: {
      gap: spacing.space4,
      paddingTop: spacing.space8,
    },
    welcomeTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: -0.45,
    },
    welcomeSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    section: { gap: spacing.space12 },
    sectionHeading: { paddingBottom: spacing.space4 },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '600',
      letterSpacing: -0.25,
    },
    tile: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radii.lg,
      padding: spacing.space16,
    },
    newsList: { gap: spacing.space12 },
    articleTile: { gap: spacing.space12 },
    featuredTile: {
      padding: spacing.space16,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    byline: { flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
    metaDot: { ...typography.small, color: colors.textMuted },
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
    meta: {
      ...typography.small,
      color: colors.textMuted,
      flexShrink: 1,
      letterSpacing: 0.1,
    },
    articleBody: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.space16,
    },
    articleText: { flex: 1, minWidth: 0, gap: spacing.space8 },
    articleTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: -0.35,
      lineHeight: 27,
    },
    articleFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.space12,
    },
    categoryPill: {
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.space12,
      paddingVertical: spacing.space4,
    },
    categoryText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    body: { ...typography.body, color: colors.textSecondary },
    illustration: { flexShrink: 0, paddingTop: spacing.space4 },
    cardImage: {
      width: '100%',
      height: imageHeight,
    },
    featureCard: {
      padding: 0,
      overflow: 'hidden',
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    featureContent: {
      gap: spacing.space8,
      padding: spacing.space16,
    },
    featureCategory: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
    },
    featureTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.space8,
    },
    featureTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 18,
      lineHeight: 24,
      flexShrink: 1,
    },
    featureDescription: {
      ...typography.small,
      color: colors.textSecondary,
    },
    eventsEmpty: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
}
