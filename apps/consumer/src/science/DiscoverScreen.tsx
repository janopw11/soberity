import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen, SettingsIcon } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { PublicationCard, ReadingCard, ReadingImage, ReadingText } from './readingUi';
import { documentText, mediaUri, scienceGet, type Article, type Category, type Claim, type Page, type Post } from './scienceApi';
import { useReadingDate } from './EvidenceCard';

type Item = Post | Article | Claim;
type FeedItem = { type: 'POST' | 'ARTICLE' | 'CLAIM'; content: Item };
export default function DiscoverScreen({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const date = useReadingDate();
  const { colors } = useThemePreferences();
  const [browseFocused, setBrowseFocused] = useState(false);
  const [browseHovered, setBrowseHovered] = useState(false);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [page, setPage] = useState(0);
  const [attempt, retry] = useState(0);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Page<FeedItem> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setCategories([]);
    void scienceGet<Category[]>(`/api/v1/science/categories?locale=${locale}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCategories(value); }).catch(() => { /* Category codes remain readable if labels are unavailable. */ });
    return () => controller.abort();
  }, [locale, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false);
    const path = compact ? `/api/v1/science/posts?page=${page}` : `/api/v1/science/feed?page=${page}&locale=${locale}`;
    const timeout = setTimeout(() => { setError(true); controller.abort(); }, 20000);
    void (compact
      ? scienceGet<Page<Post>>(path, controller.signal).then(value => ({ ...value, items: value.items.map(content => ({ type: 'POST' as const, content })) }))
      : scienceGet<Page<FeedItem>>(path, controller.signal))
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [compact, locale, page, attempt]);
  const content = <>
    <ReadingText heading>{t(compact ? 'discover.latest' : 'discover.articles')}</ReadingText>
    {error ? <ReadingCard><Alert variant="danger" message={t('discover.error')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></ReadingCard> : !data ? <LoadingState label={t('discover.loading')} /> : data.items.length === 0 ? <ReadingCard><ReadingText heading>{t('discover.emptyTitle')}</ReadingText><ReadingText muted>{t('discover.empty')}</ReadingText>{page > 0 ? <Button variant="secondary" label={t('discover.firstPage')} onPress={() => setPage(0)} /> : null}</ReadingCard> : <>
      {(compact ? data.items.slice(0, 3) : data.items).map(({ type, content: item }) => {
        const post = 'document' in item ? item : null;
        const claim = 'claim_text' in item ? item : null;
        const title = claim ? claim.claim_text : (item as Article | Post).title;
        const target = post ? 'post' : claim ? 'evidence' : 'article';
        const summary = post ? documentText(post.document) : (item as Article | Claim).summary;
        return <PublicationCard key={`${type}:${item.id}`} href={`/science/${target}/${item.id}`} title={title}>
          {post?.cover_id ? <ReadingImage uri={mediaUri(post.cover_id)} alt={post.cover_alt || title} cover /> : null}
          {!post || post.publication_route === 'REVIEWED' ? <ReadingText muted>{t(claim ? 'discover.evidence' : 'discover.reviewedArticle')}</ReadingText> : null}
          <ReadingText heading>{title}</ReadingText>
          <ReadingText muted>{date(item.published_at)}{'category_code' in item ? ` · ${categories.find(value => value.code === item.category_code)?.label ?? item.category_code}` : ''}</ReadingText>
          <ReadingText>{summary.length > 260 ? `${summary.slice(0, 260)}…` : summary}</ReadingText>
          {claim ? <ReadingText>{t('discover.certainty')}: {t(`discover.levels.${claim.evidence_level}`, { defaultValue: t('discover.notProvided') })}</ReadingText> : null}
        </PublicationCard>;
      })}
      {!compact ? <View style={{ gap: spacing.space8 }}><ReadingText muted>{t('discover.page', { page: data.page + 1, count: data.total })}</ReadingText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 }}><Button variant="secondary" label={t('discover.previous')} disabled={page === 0} onPress={() => setPage(value => value - 1)} /><Button variant="secondary" label={t('discover.next')} disabled={(page + 1) * data.size >= data.total} onPress={() => setPage(value => value + 1)} /></View></View> : null}
    </>}
    {compact ? (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('discover.browse')}
        onPress={() => router.push('/science')}
        onFocus={() => setBrowseFocused(true)}
        onBlur={() => setBrowseFocused(false)}
        onHoverIn={() => setBrowseHovered(true)}
        onHoverOut={() => setBrowseHovered(false)}
        style={({ pressed }) => [
          styles.browse,
          {
            backgroundColor: pressed || browseHovered ? colors.primary : colors.surfaceAlt,
            borderColor: browseFocused ? colors.focusRing : colors.primary,
          },
          browseFocused && styles.browseFocused,
        ]}
      >
        {({ pressed }) => (
          <>
            <Text style={[styles.browseLabel, { color: pressed || browseHovered ? colors.onPrimary : colors.primary }]}>
              {t('discover.browse')}
            </Text>
            <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <SettingsIcon name="chevron" size={20} color={pressed || browseHovered ? colors.onPrimary : colors.primary} />
            </View>
          </>
        )}
      </Pressable>
    ) : null}
  </>;
  return compact ? <View style={{ gap: spacing.space16 }}>{content}</View> : <Screen maxWidth={800}>{content}</Screen>;
}

const styles = StyleSheet.create({
  browse: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.space16,
    paddingVertical: spacing.space16,
    paddingHorizontal: spacing.space24,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  browseFocused: { borderWidth: 2, borderStyle: 'dashed' },
  browseLabel: { ...typography.bodyStrong, flexShrink: 1 },
});
