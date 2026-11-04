import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { FeaturedArticleCard } from './FeaturedArticleCard';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { PublicationCard, ReadingImage } from './readingUi';
import { mediaUri, type Post } from './scienceApi';
import { useReadingDate } from './EvidenceCard';

/** Article list with an editorial feature variant for Weekly Science Drop. */
export function PostPublicationCard({ post, categoryLabel, note, featured = false, articleOfWeek = false }: { post: Post; categoryLabel?: string | undefined; note?: string | undefined; featured?: boolean; articleOfWeek?: boolean }) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const date = useReadingDate();
  const category = categoryLabel ?? post.category_code;
  if (featured) return <FeaturedArticleCard post={post} categoryLabel={categoryLabel} note={note} />;
  return <PublicationCard href={`/science/post/${post.id}`} title={post.title} variant="list" badge={articleOfWeek ? t('weekly.articleOfWeek') : undefined}>
    {post.cover_id ? <View style={styles.thumbnail}>
      <ReadingImage uri={mediaUri(post.cover_id)} alt={post.cover_alt || post.title} cover thumbnail />
    </View> : null}
    <View style={styles.content}>
      {note ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{note}</Text> : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.primary }]}>{post.title}</Text>
      <View style={styles.metadata}>
        {category ? <View style={[styles.pill, { backgroundColor: colors.primary }]}>
          <Text style={[styles.meta, { color: colors.onPrimary }]}>{category}</Text>
        </View> : null}
        <Text style={[styles.meta, { color: colors.textMuted }]}>{date(post.created_at)}</Text>
      </View>
    </View>
  </PublicationCard>;
}
const styles = StyleSheet.create({
  thumbnail: { width: '24%', maxWidth: 80, height: 80, flexShrink: 0, overflow: 'hidden', borderRadius: radii.sm, alignSelf: 'flex-start' },
  content: { flex: 1, minWidth: 0, gap: spacing.space4, justifyContent: 'center' },
  metadata: { alignItems: 'flex-start', gap: spacing.space4 },
  pill: { maxWidth: '100%', borderRadius: radii.pill, paddingVertical: spacing.space4 / 2, paddingHorizontal: spacing.space8 },
  title: { ...typography.bodyStrong }, meta: { ...typography.caption },
});
