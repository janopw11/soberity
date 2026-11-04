import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen, SettingsIcon, TextField } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { PublicationCard, ReadingCard, ReadingImage, ReadingText } from './readingUi';
import { mediaUri, scienceGet, type Article, type Category, type Claim, type Page, type Post } from './scienceApi';
import { useReadingDate } from './EvidenceCard';
import { Pagination } from '../ui/Pagination';
import { ChapterHeading } from '../ChapterHeading';
import CategorySelect from './CategorySelect';

const SEARCH_DEBOUNCE_MS = 500;

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
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ query: '', category: '', page: 0 });
  const { query, category, page } = filters;
  const setPage = (nextPage: number) => setFilters(previous => ({ ...previous, page: nextPage }));
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchInput.trim();
      setFilters(previous => previous.query === nextQuery ? previous : { ...previous, query: nextQuery, page: 0 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);
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
    const path = compact ? `/api/v1/science/posts?page=${page}`
      : `/api/v1/science/feed?page=${page}&size=3&locale=${locale}&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    const timeout = setTimeout(() => { setError(true); controller.abort(); }, 20000);
    void (compact
      ? scienceGet<Page<Post>>(path, controller.signal).then(value => ({ ...value, items: value.items.map(content => ({ type: 'POST' as const, content })) }))
      : scienceGet<Page<FeedItem>>(path, controller.signal))
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [compact, locale, page, query, category, attempt]);
  const content = <>
    {compact ? <ChapterHeading>{t('discover.latest')}</ChapterHeading> : null}
    {!compact ? <View style={styles.filters}>
      <View style={styles.searchField}>
        <TextField
          compact
          label={t('discover.searchTitle')}
          placeholder={t('discover.searchPlaceholder')}
          value={searchInput}
          onChangeText={setSearchInput}
          maxLength={200}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accentLabel
        />
      </View>
      <View style={styles.categoryFilter}>
        <Text style={[styles.filterLabel, { color: colors.primary }]}>{t('discover.categoryFilter')}</Text>
        <CategorySelect
          label={t('discover.categoryFilter')}
          value={category}
          options={[{ value: '', label: t('discover.allCategories') }, ...categories.map(item => ({ value: item.code, label: item.label }))]}
          onChange={value => setFilters(previous => ({ ...previous, category: value, query: searchInput.trim(), page: 0 }))}
        />
      </View>
    </View> : null}
    {error ? <ReadingCard><Alert variant="danger" message={t('discover.error')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></ReadingCard> : !data ? <LoadingState label={t('discover.loading')} /> : data.items.length === 0 ? <ReadingCard><ReadingText heading>{t(!compact && (query || category) ? 'discover.noMatchesTitle' : 'discover.emptyTitle')}</ReadingText><ReadingText muted>{t(!compact && (query || category) ? 'discover.noMatches' : 'discover.empty')}</ReadingText>{page > 0 ? <Button variant="secondary" label={t('discover.firstPage')} onPress={() => setPage(0)} /> : null}</ReadingCard> : <>
      {(compact ? data.items.slice(0, 3) : data.items).map(({ type, content: item }) => {
        const post = 'document' in item ? item : null;
        const claim = 'claim_text' in item ? item : null;
        const title = claim ? claim.claim_text : (item as Article | Post).title;
        const target = post ? 'post' : claim ? 'evidence' : 'article';
        const category = 'category_code' in item ? (categories.find(value => value.code === item.category_code)?.label ?? item.category_code) : null;
        return <PublicationCard key={`${type}:${item.id}`} href={`/science/${target}/${item.id}`} title={title} variant="list">
          {post?.cover_id ? (
            <View style={styles.listThumbnail}>
              <ReadingImage uri={mediaUri(post.cover_id)} alt={post.cover_alt || title} cover thumbnail />
            </View>
          ) : null}
          <View style={styles.listContent}>
            {!post || post.publication_route === 'REVIEWED' ? <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{t(claim ? 'discover.evidence' : 'discover.reviewedArticle')}</Text> : null}
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.primary }]}>{title}</Text>
            <View style={styles.listMeta}>
              {category ? <View style={[styles.categoryPill, { backgroundColor: colors.primary }]}>
                <Text style={[styles.cardMeta, { color: colors.onPrimary }]}>{category}</Text>
              </View> : null}
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{date(post ? post.created_at : item.published_at)}</Text>
            </View>
            {claim ? <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{t('discover.certainty')}: {t(`discover.levels.${claim.evidence_level}`, { defaultValue: t('discover.notProvided') })}</Text> : null}
          </View>
        </PublicationCard>;
      })}

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
            backgroundColor: colors.surfaceAlt,
            opacity: pressed ? 0.8 : 1,
            borderColor: browseFocused ? colors.focusRing : browseHovered ? colors.border : 'transparent',
          },
        ]}
      >
        <>
            <Text style={[styles.browseLabel, { color: colors.primary }]}>
              {t('discover.browse')}
            </Text>
            <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <SettingsIcon name="chevron" size={20} color={colors.primary} />
            </View>
        </>
      </Pressable>
    ) : null}
  </>;
  return compact ? <View style={{ gap: spacing.space16 }}>{content}</View> : (
    <Screen maxWidth={800} contentStyle={styles.fullPage}>
      <View style={styles.feed}>{content}</View>
      {!error && data && data.items.length > 0 ? (
        <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage}
          label={t('discover.page', { page: data.page + 1, pages: Math.max(1, Math.ceil(data.total / Math.max(1, data.size))), count: data.total })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { zIndex: 20, flexDirection: 'row', gap: spacing.space8, alignItems: 'flex-start' },
  searchField: { flex: 3, minWidth: 0 },
  categoryFilter: { zIndex: 20, flex: 2, minWidth: 0, gap: spacing.space4 },
  filterLabel: { ...typography.caption },
  listThumbnail: { width: '24%', maxWidth: 80, height: 80, flexShrink: 0, overflow: 'hidden', borderRadius: radii.sm, alignSelf: 'flex-start' },
  listContent: { flex: 1, minWidth: 0, gap: spacing.space4, justifyContent: 'center' },
  listMeta: { alignItems: 'flex-start', gap: spacing.space4 },
  categoryPill: { maxWidth: '100%', borderRadius: radii.pill, paddingVertical: spacing.space4 / 2, paddingHorizontal: spacing.space8 },
  cardTitle: { ...typography.bodyStrong },
  cardMeta: { ...typography.caption },
  fullPage: { flexGrow: 1 },
  feed: { width: '100%', minWidth: 0, flexGrow: 1, gap: spacing.space24 },
  browse: {
    minHeight: 48,
    alignSelf: 'center',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space8,
    paddingVertical: spacing.space12,
    paddingHorizontal: spacing.space24,
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  browseLabel: { ...typography.bodyStrong, flexShrink: 1 },
});
