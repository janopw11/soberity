import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import { type Page } from '../science/scienceApi';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { QuizCategoryGrid } from './QuizCategoryGrid';
import { QUIZ_CATEGORIES, type QuizCategory } from './quizCategories';
import { QuizCard } from './QuizCard';
import { Pagination } from '../ui/Pagination';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import {
  learningRequest,
  type QuizSummary,
  type QuizCompletion,
} from './learningApi';

export default function LearningScreen({
  quizzesOnly = false,
}: {
  quizzesOnly?: boolean;
}) {
  const { user } = useAuthStatus();
  return (
    <LearningCatalog key={user?.uid ?? 'guest'} quizzesOnly={quizzesOnly} />
  );
}
function LearningCatalog({ quizzesOnly }: { quizzesOnly: boolean }) {
  const { status, getIdToken } = useAuthStatus();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useThemePreferences();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [page, setPage] = useState(0);
  const params = useLocalSearchParams<{ category?: string }>();
  const category = quizzesOnly && QUIZ_CATEGORIES.includes(params.category as QuizCategory)
    ? params.category as QuizCategory : null;
  useEffect(() => { setPage(0); }, [category]);
  const [attempt, retry] = useState(0);
  const [data, setData] = useState<Page<QuizSummary> | null>(null);
  const [error, setError] = useState(false);
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  useEffect(() => {
    if (quizzesOnly && category === null) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setData(null);
    setError(false);
    void (async () => {
      const token = status === 'authenticated' ? await getIdToken() : null;
      if (status === 'authenticated' && !token)
        throw new Error('Session unavailable');
      const [catalog, completions] = await Promise.all([
        learningRequest<Page<QuizSummary>>(
          `/api/v1/learning/quizzes?locale=${locale}&page=${page}${category ? `&category=${category}` : ''}`,
          { signal: controller.signal },
        ),
        token
          ? learningRequest<QuizCompletion[]>(
              '/api/v1/me/learning/quizzes/results',
              { token, signal: controller.signal },
            )
          : Promise.resolve([]),
      ]);
      if (!controller.signal.aborted)
        setData({
          ...catalog,
          items: catalog.items.map((quiz) => ({
            ...quiz,
            completion: completions.find(
              (result) =>
                result.quiz_id === quiz.id && result.version === quiz.version,
            ),
          })),
        });
    })().catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [locale, page, attempt, status, getIdToken, category, quizzesOnly]);
  return (
    <Screen maxWidth={800} contentStyle={styles.fullPage}>
      <View style={styles.content}>
        {!quizzesOnly ? (
          <>
            <ReadingText heading>{t('learning.title')}</ReadingText>
            <ReadingText muted>{t('learning.intro')}</ReadingText>
          </>
        ) : null}
        {!quizzesOnly ? (
          <ReadingCard>
            <ReadingText heading>{t('learning.flashcards')}</ReadingText>
            <ReadingText>{t('learning.flashcardIntro')}</ReadingText>
            <Button
              label={t('learning.openCards')}
              onPress={() => router.push('/science/flashcards')}
            />
          </ReadingCard>
        ) : null}
        {!quizzesOnly ? (
          <ReadingText heading>{t('learning.quizzes')}</ReadingText>
        ) : null}
        {quizzesOnly && category ? (
          <Text accessibilityRole="header" style={[styles.categoryTitle, { color: colors.primary }]}>
            {t(`learning.categories.${category}`)}
          </Text>
        ) : null}
        {quizzesOnly && category === null ? (
          <QuizCategoryGrid
            onSelect={(value) => {
              router.setParams({ category: value });
              setPage(0);
            }}
          />
        ) : error ? (
          <>
            <Alert variant="danger" message={t('learning.loadError')} />
            <Button
              label={t('discover.retry')}
              variant="secondary"
              onPress={() => retry((value) => value + 1)}
            />
          </>
        ) : !data ? (
          <LoadingState label={t('discover.loading')} />
        ) : (
          <>
            {!data.items.length ? (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: colors.listSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  accessibilityRole="header"
                  style={[styles.emptyTitle, { color: colors.primary }]}
                >
                  {t('learning.noQuizzes')}
                </Text>
              </View>
            ) : (
              data.items.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onStart={() => router.push(`/science/quiz/${quiz.id}`)}
                />
              ))
            )}
          </>
        )}

      </View>
      {(!quizzesOnly || category !== null) &&
      !error &&
      data &&
      data.items.length > 0 ? (
        <Pagination
          page={data.page}
          size={data.size}
          total={data.total}
          onPageChange={setPage}
          label={t('learning.page', {
            page: data.page + 1,
            pages: Math.max(1, Math.ceil(data.total / Math.max(1, data.size))),
            count: data.total,
          })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fullPage: { flexGrow: 1 },
  categoryTitle: { ...typography.h3, textAlign: 'center', width: '100%' },
  content: { flexGrow: 1, gap: spacing.space24 },
  empty: {
    padding: spacing.space24,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
});
