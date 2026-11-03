import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import { type Page } from '../science/scienceApi';
import { learningRequest, type QuizSummary } from './learningApi';

export default function LearningScreen({ quizzesOnly = false }: { quizzesOnly?: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [page, setPage] = useState(0);
  const [attempt, retry] = useState(0);
  const [data, setData] = useState<Page<QuizSummary> | null>(null);
  const [error, setError] = useState(false);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false);
    void learningRequest<Page<QuizSummary>>(`/api/v1/learning/quizzes?locale=${locale}&page=${page}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [locale, page, attempt]);
  return <Screen maxWidth={800}>
    <ReadingText heading>{t(quizzesOnly ? 'learning.quizzes' : 'learning.title')}</ReadingText>
    <ReadingText muted>{t('learning.intro')}</ReadingText>
    {!quizzesOnly ? <ReadingCard><ReadingText heading>{t('learning.flashcards')}</ReadingText><ReadingText>{t('learning.flashcardIntro')}</ReadingText><Button label={t('learning.openCards')} onPress={() => router.push('/science/flashcards')} /></ReadingCard> : null}
    {!quizzesOnly ? <ReadingText heading>{t('learning.quizzes')}</ReadingText> : null}
    {error ? <><Alert variant="danger" message={t('learning.loadError')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></> : !data ? <LoadingState label={t('discover.loading')} /> : <>
      {!data.items.length ? <ReadingCard><ReadingText>{t('learning.emptyQuizzes')}</ReadingText></ReadingCard> : data.items.map(quiz => <ReadingCard key={quiz.id}><ReadingText heading>{quiz.title}</ReadingText><ReadingText muted>{t('learning.questionCount', { count: quiz.question_count })}</ReadingText><Button label={t('learning.startQuiz')} accessibilityHint={quiz.title} variant="secondary" onPress={() => router.push(`/science/quiz/${quiz.id}`)} /></ReadingCard>)}
      <View style={{ flexDirection: 'row', gap: spacing.space8, flexWrap: 'wrap' }}><Button variant="secondary" label={t('discover.previous')} disabled={page === 0} onPress={() => setPage(value => value - 1)} /><Button variant="secondary" label={t('discover.next')} disabled={(page + 1) * data.size >= data.total} onPress={() => setPage(value => value + 1)} /></View>
    </>}
    <Button variant="tertiary" label={t('discover.back')} onPress={() => router.push('/science')} />
  </Screen>;
}
