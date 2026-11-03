import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { ReadingCard, ReadingImage, ReadingText } from './readingUi';
import { documentText, mediaUri, scienceGet, type Article, type Category, type Claim, type Page, type Post } from './scienceApi';
import { useReadingDate } from './EvidenceCard';

type Section = 'posts' | 'articles' | 'claims';
type Item = Post | Article | Claim;
export default function DiscoverScreen({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const date = useReadingDate();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [section, setSection] = useState<Section>('posts');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [attempt, retry] = useState(0);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Page<Item> | null>(null);
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
    const path = section === 'posts' ? '/api/v1/science/posts' : section === 'articles' ? '/api/v1/science/articles' : '/api/v1/evidence/claims';
    const query = section === 'posts' ? `page=${page}` : `page=${page}&locale=${locale}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    const timeout = setTimeout(() => { setError(true); controller.abort(); }, 20000);
    void scienceGet<Page<Item>>(`${path}?${query}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [section, category, locale, page, attempt]);
  const content = <>
    {!compact ? <>
      <ReadingText heading>{t('discover.title')}</ReadingText>
      <ReadingText muted>{t('discover.intro')}</ReadingText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 }}>
        {(['posts', 'articles', 'claims'] as const).map(value => <Button key={value} variant={section === value ? 'primary' : 'secondary'} label={`${section === value ? '✓ ' : ''}${t(`discover.sections.${value}`)}`} onPress={() => { setSection(value); setPage(0); setCategory(''); }} />)}
      </View>
      {section !== 'posts' && categories.length > 0 ? <View style={{ gap: spacing.space8 }}><ReadingText>{t('discover.category')}</ReadingText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 }}><Button label={`${!category ? '✓ ' : ''}${t('discover.allCategories')}`} variant={!category ? 'primary' : 'secondary'} onPress={() => { setCategory(''); setPage(0); }} />{categories.map(item => <Button key={item.code} label={`${category === item.code ? '✓ ' : ''}${item.label}`} variant={category === item.code ? 'primary' : 'secondary'} onPress={() => { setCategory(item.code); setPage(0); }} />)}</View></View> : null}
      <ReadingText muted>{t(section === 'posts' ? 'discover.originalLanguage' : 'discover.localeLibrary')}</ReadingText>
    </> : <ReadingText heading>{t('discover.latest')}</ReadingText>}
    {error ? <ReadingCard><Alert variant="danger" message={t('discover.error')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></ReadingCard> : !data ? <LoadingState label={t('discover.loading')} /> : data.items.length === 0 ? <ReadingCard><ReadingText heading>{t('discover.emptyTitle')}</ReadingText><ReadingText muted>{t('discover.empty')}</ReadingText>{page > 0 ? <Button variant="secondary" label={t('discover.firstPage')} onPress={() => setPage(0)} /> : null}</ReadingCard> : <>
      {(compact ? data.items.slice(0, 3) : data.items).map(item => {
        const post = 'document' in item ? item : null;
        const claim = 'claim_text' in item ? item : null;
        const title = claim ? claim.claim_text : (item as Article | Post).title;
        const target = post ? 'post' : claim ? 'evidence' : 'article';
        const summary = post ? documentText(post.document) : (item as Article | Claim).summary;
        return <ReadingCard key={item.id}>
          {post?.cover_id ? <ReadingImage uri={mediaUri(post.cover_id)} alt={post.cover_alt || title} cover /> : null}
          <ReadingText muted>{post ? t(post.publication_route === 'REVIEWED' ? 'discover.reviewedArticle' : 'discover.authorPublication') : t(claim ? 'discover.evidence' : 'discover.reviewedArticle')}</ReadingText>
          <ReadingText heading>{title}</ReadingText>
          <ReadingText muted>{date(item.published_at)}{'category_code' in item ? ` · ${categories.find(value => value.code === item.category_code)?.label ?? item.category_code}` : ''}</ReadingText>
          <ReadingText>{summary.length > 260 ? `${summary.slice(0, 260)}…` : summary}</ReadingText>
          {claim ? <ReadingText>{t('discover.certainty')}: {t(`discover.levels.${claim.evidence_level}`, { defaultValue: t('discover.notProvided') })}</ReadingText> : null}
          <Button label={t('discover.read')} accessibilityHint={title} variant="tertiary" onPress={() => router.push(`/science/${target}/${item.id}`)} />
        </ReadingCard>;
      })}
      {!compact ? <View style={{ gap: spacing.space8 }}><ReadingText muted>{t('discover.page', { page: data.page + 1, count: data.total })}</ReadingText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 }}><Button variant="secondary" label={t('discover.previous')} disabled={page === 0} onPress={() => setPage(value => value - 1)} /><Button variant="secondary" label={t('discover.next')} disabled={(page + 1) * data.size >= data.total} onPress={() => setPage(value => value + 1)} /></View></View> : null}
    </>}
    {compact ? <Button variant="tertiary" label={t('discover.browse')} onPress={() => router.push('/science')} /> : null}
  </>;
  return compact ? <View style={{ gap: spacing.space16 }}>{content}</View> : <Screen maxWidth={800}>{content}</Screen>;
}
