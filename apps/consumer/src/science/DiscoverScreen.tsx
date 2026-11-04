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
import { ChapterHeading } from '../ChapterHeading';

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
    const path = compact ? `/api/v1/science/posts?page=${page}` : `/api/v1/science/feed?page=${page}&size=3&locale=${locale}`;
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
    <ChapterHeading>{t(compact ? 'discover.latest' : 'discover.articles')}</ChapterHeading>
    {error ? <ReadingCard><Alert variant="danger" message={t('discover.error')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></ReadingCard> : !data ? <LoadingState label={t('discover.loading')} /> : data.items.length === 0 ? <ReadingCard><ReadingText heading>{t('discover.emptyTitle')}</ReadingText><ReadingText muted>{t('discover.empty')}</ReadingText>{page > 0 ? <Button variant="secondary" label={t('discover.firstPage')} onPress={() => setPage(0)} /> : null}</ReadingCard> : <>
      {(compact ? data.items.slice(0, 3) : data.items).map(({ type, content: item }) => {
        const post = 'document' in item ? item : null;
        const claim = 'claim_text' in item ? item : null;
        const title = claim ? claim.claim_text : (item as Article | Post).title;
        const target = post ? 'post' : claim ? 'evidence' : 'article';
        const summary = post ? documentText(post.document) : (item as Article | Claim).summary;
        return <PublicationCard key={`${type}:${item.id}`} href={`/science/${target}/${item.id}`} title={title}>
          {post?.cover_id ? (
            <View style={styles.thumbnail}>
              <ReadingImage uri={mediaUri(post.cover_id)} alt={post.cover_alt || title} cover thumbnail />
            </View>
          ) : null}
          <View style={styles.cardContent}>
            {!post || post.publication_route === 'REVIEWED' ? <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{t(claim ? 'discover.evidence' : 'discover.reviewedArticle')}</Text> : null}
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.primary }]}>{title}</Text>
            <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{date(item.published_at)}{'category_code' in item ? ` · ${categories.find(value => value.code === item.category_code)?.label ?? item.category_code}` : ''}</Text>
            <Text numberOfLines={compact ? 2 : 3} style={[styles.cardSummary, { color: colors.textSecondary }]}>{summary}</Text>
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
        <View style={[styles.pagination, { backgroundColor: colors.surfaceAlt }]}>
          <PageArrow direction="previous" disabled={data.page === 0} onPress={() => setPage(Math.max(0, data.page - 1))} />
          <Text accessibilityLiveRegion="polite" style={[styles.pageLabel, { color: colors.textSecondary }]}>
            {t('discover.page', { page: data.page + 1, pages: Math.max(1, Math.ceil(data.total / Math.max(1, data.size))), count: data.total })}
          </Text>
          <PageArrow direction="next" disabled={(data.page + 1) * data.size >= data.total} onPress={() => setPage(data.page + 1)} />
        </View>
      ) : null}
    </Screen>
  );
}

function PageArrow({ direction, disabled, onPress }: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`discover.${direction}`)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.pageArrow, {
        backgroundColor: !disabled && (pressed || hovered) ? colors.surface : 'transparent',
        borderColor: focused ? colors.focusRing : 'transparent',
      }]}
    >
      <View style={direction === 'previous' ? styles.arrowLeft : undefined} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SettingsIcon name="chevron" size={20} color={disabled ? colors.textMuted : colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumbnail: { width: '100%', height: 144, overflow: 'hidden' },
  cardContent: { minWidth: 0, gap: spacing.space8, padding: spacing.space16 },
  cardTitle: { ...typography.bodyStrong },
  cardMeta: { ...typography.caption },
  cardSummary: { ...typography.small },
  fullPage: { flexGrow: 1 },
  feed: { flexGrow: 1, gap: spacing.space24 },
  pagination: {
    alignSelf: 'center',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    padding: spacing.space4,
    gap: spacing.space4,
  },
  pageArrow: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  arrowLeft: { transform: [{ rotate: '180deg' }] },
  pageLabel: { ...typography.small, flexShrink: 1, textAlign: 'center' },
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
