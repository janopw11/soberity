import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { Alert, Button, LoadingState } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import { scienceGet, type Category, type Post } from '../science/scienceApi';
import { PostPublicationCard } from '../science/PostPublicationCard';
import { ChapterHeading } from '../ChapterHeading';

type Current = { article: Post | null; fallback: boolean; starts_at?: string };
export default function WeeklyScienceCard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [data, setData] = useState<Current | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(false); setCategories([]);
    void scienceGet<Category[]>(`/api/v1/science/categories?locale=${locale}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCategories(value); })
      .catch(() => { /* Match the article list's category-code fallback. */ });
    const timeout = setTimeout(() => { setError(true); controller.abort(); }, 20000);
    void scienceGet<Current>(`/api/v1/discover/weekly/current?locale=${locale}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [locale, attempt]);
  const article = data?.article;
  return <View style={styles.section}>
    <ChapterHeading icon="book">{t('weekly.title')}</ChapterHeading>
    {error ? <ReadingCard>
      <Alert variant="danger" message={t('weekly.loadError')} />
      <Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} />
    </ReadingCard> : !data ? <LoadingState label={t('discover.loading')} /> : !article ? <ReadingCard>
      <ReadingText>{t('weekly.empty')}</ReadingText>
    </ReadingCard> : <PostPublicationCard
      post={article}
      featured
      categoryLabel={categories.find(category => category.code === article.category_code)?.label}
      note={data.fallback ? t('weekly.previousPick') : undefined}
    />}

  </View>;
}
const styles = StyleSheet.create({ section: { gap: spacing.space16 } });
