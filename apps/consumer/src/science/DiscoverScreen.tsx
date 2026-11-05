import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen, SettingsIcon } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { PublicationCard, ReadingCard, ReadingText } from './readingUi';
import {
  scienceGet,
  type Article,
  type Category,
  type Claim,
  type Page,
  type Post,
} from './scienceApi';
import { useReadingDate } from './EvidenceCard';
import { ChapterHeading } from '../ChapterHeading';
import { CategoryChips } from '../ui/CategoryChips';
import { PostPublicationCard } from './PostPublicationCard';

const SEARCH_DEBOUNCE_MS = 500;

type Item = Post | Article | Claim;
type FeedItem = { type: 'POST' | 'ARTICLE' | 'CLAIM'; content: Item };
export default function DiscoverScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const date = useReadingDate();
  const { colors } = useThemePreferences();
  const [searchFocused, setSearchFocused] = useState(false);
  const [clearFocused, setClearFocused] = useState(false);
  const moreRequest = useRef<AbortController | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [browseFocused, setBrowseFocused] = useState(false);
  const [browseHovered, setBrowseHovered] = useState(false);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ query: '', category: '', page: 0 });
  const { query, category, page } = filters;
  const setPage = (nextPage: number) =>
    setFilters((previous) => ({ ...previous, page: nextPage }));
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchInput.trim();
      setFilters((previous) =>
        previous.query === nextQuery
          ? previous
          : { ...previous, query: nextQuery, page: 0 },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [attempt, retry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  const [weeklyArticle, setWeeklyArticle] = useState<{
    locale: string;
    id: string | null;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Page<FeedItem> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setCategories([]);
    void scienceGet<Category[]>(
      `/api/v1/science/categories?locale=${locale}`,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) setCategories(value);
      })
      .catch(() => {
        /* Category codes remain readable if labels are unavailable. */
      });
    return () => controller.abort();
  }, [locale, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    moreRequest.current?.abort();
    moreRequest.current = null;
    setLoadingMore(false);
    setMoreError(false);
    setData(null);
    setError(false);
    const path = compact
      ? `/api/v1/science/posts?page=${page}`
      : `/api/v1/science/feed?page=${page}&size=3&locale=${locale}&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    const timeout = setTimeout(() => {
      setError(true);
      controller.abort();
    }, 20000);
    void (
      compact
        ? scienceGet<Page<Post>>(path, controller.signal).then((value) => ({
            ...value,
            items: value.items.map((content) => ({
              type: 'POST' as const,
              content,
            })),
          }))
        : scienceGet<Page<FeedItem>>(path, controller.signal)
    )
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [compact, locale, page, query, category, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    setWeeklyArticle(null);
    if (compact) return () => controller.abort();
    const timeout = setTimeout(() => controller.abort(), 20000);
    void scienceGet<{ article: Post | null }>(
      `/api/v1/discover/weekly/current?locale=${locale}`,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted)
          setWeeklyArticle({ locale, id: value.article?.id ?? null });
      })
      .catch(() => {
        /* An unavailable optional marker must not block article browsing. */
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [compact, locale, attempt]);
  const clearFilters = () => {
    setSearchInput('');
    setFilters({ query: '', category: '', page: 0 });
  };
  const loadMore = async () => {
    if (
      compact ||
      !data ||
      moreRequest.current ||
      (data.page + 1) * data.size >= data.total
    )
      return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(false);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const next = await scienceGet<Page<FeedItem>>(
        `/api/v1/science/feed?page=${data.page + 1}&size=${data.size}&locale=${locale}&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`,
        controller.signal,
      );
      if (moreRequest.current !== controller || controller.signal.aborted)
        return;
      setData((previous) => {
        if (!previous) return previous;
        const seen = new Set(
          previous.items.map((item) => `${item.type}:${item.content.id}`),
        );
        return {
          ...next,
          items: [
            ...previous.items,
            ...next.items.filter(
              (item) => !seen.has(`${item.type}:${item.content.id}`),
            ),
          ],
        };
      });
    } catch {
      if (moreRequest.current === controller) setMoreError(true);
    } finally {
      clearTimeout(timeout);
      if (moreRequest.current === controller) {
        moreRequest.current = null;
        setLoadingMore(false);
      }
    }
  };
  const minimalState = error ? (
    <View style={styles.message}>
      <Text
        accessibilityRole="alert"
        style={[styles.cardMeta, { color: colors.textSecondary }]}
      >
        {t('discover.error')}
      </Text>
      <Button
        label={t('discover.retry')}
        variant="tertiary"
        onPress={() => retry((value) => value + 1)}
      />
    </View>
  ) : !data ? (
    <View
      accessibilityLabel={t('discover.loading')}
      accessibilityState={{ busy: true }}
      style={styles.skeletons}
    >
      {[0, 1, 2].map((key) => (
        <View
          key={key}
          accessible={false}
          style={[styles.skeleton, { backgroundColor: colors.listSurface }]}
        >
          <View
            style={[
              styles.skeletonImage,
              { backgroundColor: colors.surfaceAlt },
            ]}
          />
          <View style={styles.skeletonCopy}>
            <View
              style={[
                styles.skeletonLine,
                { backgroundColor: colors.surfaceAlt },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                { width: '65%', backgroundColor: colors.surfaceAlt },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  ) : data.items.length === 0 ? (
    <View style={styles.message}>
      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
        {t(
          query || category ? 'discover.noMatchesTitle' : 'discover.emptyTitle',
        )}
      </Text>
      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
        {t(query || category ? 'discover.noMatches' : 'discover.empty')}
      </Text>
      {query || category ? (
        <Button
          variant="tertiary"
          label={t('discover.clearFilters')}
          onPress={clearFilters}
        />
      ) : null}
    </View>
  ) : null;
  const content = (
    <>
      {compact ? (
        <ChapterHeading icon="book">{t('discover.latest')}</ChapterHeading>
      ) : null}
      {!compact ? (
        <View style={styles.filters}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.listSurface,
                borderColor: searchFocused ? colors.focusRing : 'transparent',
              },
            ]}
          >
            <SettingsIcon name="search" color={colors.textMuted} size={18} />
            <TextInput
              accessibilityLabel={t('discover.searchArticles')}
              placeholder={t('discover.searchArticles')}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={searchInput}
              onChangeText={setSearchInput}
              maxLength={200}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchInput ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('discover.clearSearch')}
                onPress={() => {
                  setSearchInput('');
                  setFilters((previous) => ({
                    ...previous,
                    query: '',
                    page: 0,
                  }));
                }}
                onFocus={() => setClearFocused(true)}
                onBlur={() => setClearFocused(false)}
                style={[
                  styles.clearSearch,
                  {
                    borderColor: clearFocused
                      ? colors.focusRing
                      : 'transparent',
                  },
                ]}
              >
                <SettingsIcon name="close" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <CategoryChips
            value={category}
            options={[
              { value: '', label: t('discover.allCategories') },
              ...categories.map((item) => ({
                value: item.code,
                label: item.label,
              })),
            ]}
            onChange={(value) =>
              setFilters((previous) => ({
                ...previous,
                category: value,
                query: searchInput.trim(),
                page: 0,
              }))
            }
          />
          <View style={styles.sectionHeading}>
            <Text
              accessibilityRole="header"
              style={[styles.sectionLabel, { color: colors.textPrimary }]}
            >
              {t(
                query || category
                  ? 'discover.searchResults'
                  : 'discover.latestArticles',
              )}
            </Text>
            {data ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.cardMeta, { color: colors.textMuted }]}
              >
                {t('discover.articleCount', { count: data.total })}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      {!compact && (!data || error || data.items.length === 0) ? (
        minimalState
      ) : error ? (
        <ReadingCard>
          <Alert variant="danger" message={t('discover.error')} />
          <Button
            label={t('discover.retry')}
            variant="secondary"
            onPress={() => retry((value) => value + 1)}
          />
        </ReadingCard>
      ) : !data ? (
        <LoadingState label={t('discover.loading')} />
      ) : data.items.length === 0 ? (
        <ReadingCard>
          <ReadingText heading>
            {t(
              !compact && (query || category)
                ? 'discover.noMatchesTitle'
                : 'discover.emptyTitle',
            )}
          </ReadingText>
          <ReadingText muted>
            {t(
              !compact && (query || category)
                ? 'discover.noMatches'
                : 'discover.empty',
            )}
          </ReadingText>
          {page > 0 ? (
            <Button
              variant="secondary"
              label={t('discover.firstPage')}
              onPress={() => setPage(0)}
            />
          ) : null}
        </ReadingCard>
      ) : (
        <>
          {(compact ? data.items.slice(0, 3) : data.items).map(
            ({ type, content: item }) => {
              const post = 'document' in item ? item : null;
              const claim = 'claim_text' in item ? item : null;
              const title = claim
                ? claim.claim_text
                : (item as Article | Post).title;
              const target = post ? 'post' : claim ? 'evidence' : 'article';
              const category =
                'category_code' in item
                  ? (categories.find(
                      (value) => value.code === item.category_code,
                    )?.label ?? item.category_code)
                  : null;
              if (post)
                return (
                  <PostPublicationCard
                    key={`${type}:${item.id}`}
                    post={post}
                    categoryLabel={category ?? undefined}
                    articleOfWeek={
                      !compact &&
                      weeklyArticle?.locale === locale &&
                      weeklyArticle.id === post.id
                    }
                  />
                );
              return (
                <PublicationCard
                  key={`${type}:${item.id}`}
                  href={`/science/${target}/${item.id}`}
                  title={title}
                  variant="list"
                >
                  <View style={styles.listContent}>
                    <Text
                      style={[styles.cardMeta, { color: colors.textSecondary }]}
                    >
                      {t(
                        claim
                          ? 'discover.evidence'
                          : 'discover.reviewedArticle',
                      )}
                    </Text>
                    <Text
                      accessibilityRole="header"
                      style={[styles.cardTitle, { color: colors.primary }]}
                    >
                      {title}
                    </Text>
                    <View style={styles.listMeta}>
                      {category ? (
                        <View
                          style={[
                            styles.categoryPill,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardMeta,
                              { color: colors.onPrimary },
                            ]}
                          >
                            {category}
                          </Text>
                        </View>
                      ) : null}
                      <Text
                        style={[styles.cardMeta, { color: colors.textMuted }]}
                      >
                        {date(item.published_at)}
                      </Text>
                    </View>
                    {claim ? (
                      <Text
                        style={[
                          styles.cardMeta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t('discover.certainty')}:{' '}
                        {t(`discover.levels.${claim.evidence_level}`, {
                          defaultValue: t('discover.notProvided'),
                        })}
                      </Text>
                    ) : null}
                  </View>
                </PublicationCard>
              );
            },
          )}
        </>
      )}
      {!compact &&
      data &&
      data.items.length > 0 &&
      (data.page + 1) * data.size < data.total ? (
        <View style={styles.message}>
          {moreError ? (
            <Text
              accessibilityRole="alert"
              style={[styles.cardMeta, { color: colors.textSecondary }]}
            >
              {t('discover.moreError')}
            </Text>
          ) : null}
          {loadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              accessibilityLabel={t('discover.loading')}
            />
          ) : (
            <Button
              variant="tertiary"
              label={t(moreError ? 'discover.retry' : 'discover.loadMore')}
              onPress={() => {
                void loadMore();
              }}
            />
          )}
        </View>
      ) : null}
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
              borderColor: browseFocused
                ? colors.focusRing
                : browseHovered
                  ? colors.border
                  : 'transparent',
            },
          ]}
        >
          <>
            <Text style={[styles.browseLabel, { color: colors.primary }]}>
              {t('discover.browse')}
            </Text>
            <View
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <SettingsIcon name="chevron" size={20} color={colors.primary} />
            </View>
          </>
        </Pressable>
      ) : null}
    </>
  );
  return compact ? (
    <View style={{ gap: spacing.space16 }}>{content}</View>
  ) : (
    <Screen maxWidth={800} contentStyle={styles.fullPage} avoidKeyboard>
      <View style={styles.feed}>{content}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.space4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: spacing.space12,
    gap: spacing.space8,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  searchInput: {
    ...typography.small,
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.space8,
  },
  clearSearch: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.space8,
    marginTop: spacing.space8,
  },
  sectionLabel: { ...typography.label },
  message: {
    alignItems: 'center',
    gap: spacing.space8,
    paddingVertical: spacing.space12,
  },
  skeletons: { gap: spacing.space12 },
  skeleton: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: spacing.space12,
    gap: spacing.space12,
    minHeight: 120,
  },
  skeletonImage: { width: 80, height: 80, borderRadius: radii.sm },
  skeletonCopy: { flex: 1, gap: spacing.space12, justifyContent: 'center' },
  skeletonLine: { height: 16, borderRadius: radii.sm, width: '90%' },
  searchField: { minWidth: 0 },
  categoryFilter: { minWidth: 0, gap: spacing.space4 },
  filterLabel: { ...typography.caption },
  listThumbnail: {
    width: '24%',
    maxWidth: 80,
    height: 80,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  listContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.space4,
    justifyContent: 'center',
  },
  listMeta: { alignItems: 'flex-start', gap: spacing.space4 },
  categoryPill: {
    maxWidth: '100%',
    borderRadius: radii.pill,
    paddingVertical: spacing.space4 / 2,
    paddingHorizontal: spacing.space8,
  },
  cardTitle: { ...typography.bodyStrong },
  cardMeta: { ...typography.caption },
  fullPage: { flexGrow: 1 },
  feed: { width: '100%', minWidth: 0, flexGrow: 1, gap: spacing.space12 },
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
