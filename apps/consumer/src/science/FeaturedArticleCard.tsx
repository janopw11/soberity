import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';
import { PublicationCard } from './readingUi';
import { documentText, mediaUri, type Post } from './scienceApi';
import { useReadingDate } from './EvidenceCard';

type Props = { post: Post; categoryLabel?: string | undefined; note?: string | undefined };

/** Editorial feature backed by the same article and destination as the article list. */
export function FeaturedArticleCard({ post, categoryLabel, note }: Props) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const date = useReadingDate();
  const body = documentText(post.document).replace(/\s+/g, ' ').trim();
  const summary = post.preview_content?.trim();
  // Reading time is an estimate, not an article attribute supplied by the API.
  const minutes = Math.max(1, Math.ceil((body ? body.split(/\s+/u).length : 0) / 200));
  const category = categoryLabel || post.category_code;

  return <PublicationCard href={`/science/post/${post.id}`} title={post.title} variant="featured">
    <ArticleCover key={post.cover_id ?? post.id} coverId={post.cover_id} />
    <View style={styles.content}>
      <View style={styles.metadata}>
        {category ? <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <Text numberOfLines={2} style={[styles.badgeText, { color: colors.primary }]}>{category}</Text>
        </View> : null}
        <Text style={[styles.date, { color: colors.textMuted }]}>{date(post.published_at || post.created_at)}</Text>
      </View>
      {note || post.publication_route === 'REVIEWED' ? <Text style={[styles.context, { color: colors.textMuted }]}>
        {[note, post.publication_route === 'REVIEWED' ? t('discover.reviewedArticle') : null].filter(Boolean).join(' · ')}
      </Text> : null}
      <Text accessibilityRole="header" numberOfLines={2} style={[styles.headline, { color: colors.textPrimary }]}>{post.title}</Text>
      {summary ? <Text numberOfLines={2} style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text> : null}
      <View style={[styles.footer, { borderTopColor: colors.chapterSurface }]}>
        <Text style={[styles.readingTime, { color: colors.textMuted }]}>{t('weekly.estimatedReadingTime', { count: minutes })}</Text>
        <View style={styles.action} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.actionText, { color: colors.primary }]}>{t('weekly.readArticle')}</Text>
          <SettingsIcon name="arrowUpRight" color={colors.primary} size={18} />
        </View>
      </View>
    </View>
  </PublicationCard>;
}

function ArticleCover({ coverId }: { coverId: string | null }) {
  const { colors } = useThemePreferences();
  const [failed, setFailed] = useState(false);
  return <View style={[styles.cover, { backgroundColor: colors.surfaceAlt }]}>
    {coverId && !failed ? <Image
      source={{ uri: mediaUri(coverId) }}
      resizeMode="cover"
      style={StyleSheet.absoluteFill}
      onError={() => setFailed(true)}
      accessible={false}
      accessibilityIgnoresInvertColors
    /> : <View style={styles.fallback} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fallbackIcon, { backgroundColor: colors.surface }]}>
        <SettingsIcon name="book" size={48} color={colors.primary} />
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  cover: { width: '100%', aspectRatio: 16 / 7.5, overflow: 'hidden' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.space16 },
  fallbackIcon: { width: 72, height: 72, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.space16, gap: spacing.space8 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.space8, justifyContent: 'space-between' },
  badge: { maxWidth: '100%', flexShrink: 1, borderRadius: radii.pill, paddingHorizontal: spacing.space12, paddingVertical: spacing.space4 },
  badgeText: { ...typography.caption, fontWeight: '600' },
  date: { ...typography.caption },
  context: { ...typography.caption },
  headline: { ...typography.h2 },
  summary: { ...typography.small },
  footer: { marginTop: 0, paddingTop: spacing.space8, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space12 },
  readingTime: { ...typography.caption },
  action: { marginLeft: 'auto', flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.space4 },
  actionText: { ...typography.label, flexShrink: 1 },
});
