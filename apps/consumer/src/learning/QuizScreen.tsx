import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen } from '../ui';
import EvidenceCard from '../science/EvidenceCard';
import { ArticleSources, ReadingCard, ReadingText } from '../science/readingUi';
import { learningRequest, type AnswerResult, type Quiz, type QuizProgress } from './learningApi';
import ProgressControl from './ProgressControl';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStatus();
  // Remount private state when switching accounts; nothing is stored in browser/device storage.
  return <QuizRunner key={`${id}:${user?.uid ?? 'guest'}`} id={id} />;
}
function QuizRunner({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController();
    setQuiz(null); setError(false); setResults({}); setIndex(0); setSelected([]); setFinished(false); setEnabled(false);
    void learningRequest<Quiz>(`/api/v1/learning/quizzes/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setQuiz(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [id, attempt]);
  const question = quiz?.questions[index];
  const answer = question ? results[question.id] : undefined;
  async function changeProgress(value: boolean) {
    if (pending.current) return;
    if (!value) { setEnabled(false); return; }
    pending.current = true; setBusy(true); setSaveError(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Session unavailable');
      const saved = await learningRequest<QuizProgress>(`/api/v1/me/learning/quizzes/${encodeURIComponent(id)}`, { token });
      if (!active.current) return;
      const merged = { ...Object.fromEntries(saved.answers.map(item => [item.question_id, item])), ...results };
      setResults(merged); setEnabled(true);
      const next = quiz?.questions.findIndex(item => !merged[item.id]) ?? 0;
      setIndex(next < 0 ? 0 : next); setSelected([]); setFinished(false);
    } catch { if (active.current) setSaveError(true); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  async function submit() {
    if (!question || !selected.length || pending.current) return;
    pending.current = true; setBusy(true); setSaveError(false);
    try {
      const token = enabled ? await getIdToken() : null;
      if (enabled && !token) throw new Error('Session unavailable');
      const result = await learningRequest<AnswerResult>(`/api/v1/learning/quizzes/${encodeURIComponent(id)}/answers`, {
        method: 'POST', ...(token ? { token } : {}), body: { questionId: question.id, selectedOptionIds: selected, saveProgress: enabled },
      });
      if (active.current) setResults(value => ({ ...value, [question.id]: result }));
    } catch { if (active.current) setSaveError(true); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  function navigate(next: number) { setIndex(next); setSelected([]); setShowEvidence(false); }
  return <Screen maxWidth={760}>
    <Button label={t('learning.backToQuizzes')} variant="tertiary" onPress={() => router.replace('/science/quizzes')} />
    {error ? <><Alert variant="danger" message={t('learning.unavailable')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></> : !quiz ? <LoadingState label={t('discover.loading')} /> : <>
      <ReadingText heading>{quiz.title}</ReadingText>
      {quiz.locale !== (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en') ? <ReadingText muted>{t('discover.languageFallback', { language: quiz.locale })}</ReadingText> : null}
      <ReadingText muted>{t('learning.noPressure')}</ReadingText>
      <ProgressControl enabled={enabled} busy={busy} onChange={value => { void changeProgress(value); }} />
      {saveError ? <Alert variant="danger" message={t('learning.answerError')} /> : null}
      {finished ? <ReadingCard><ReadingText heading>{t('learning.complete')}</ReadingText><ReadingText>{t('learning.summary', { correct: Object.values(results).filter(item => item.correct).length, total: quiz.questions.length })}</ReadingText><ReadingText muted>{t('learning.repeatNote')}</ReadingText><Button label={t('learning.repeat')} onPress={() => { setResults({}); navigate(0); setFinished(false); }} /></ReadingCard> : question ? <>
        <ReadingText>{t('learning.position', { current: index + 1, total: quiz.questions.length })}</ReadingText>
        <ReadingText heading>{question.prompt}</ReadingText>
        <ReadingText muted>{t(question.type === 'MULTIPLE_CHOICE' ? 'learning.selectMany' : 'learning.selectOne')}</ReadingText>
        <View accessibilityRole={question.type === 'MULTIPLE_CHOICE' ? undefined : 'radiogroup'} accessibilityLabel={question.prompt} style={{ gap: spacing.space8 }}>{question.options.map(option => {
          const checked = answer ? answer.selected_option_ids.includes(option.id) : selected.includes(option.id);
          const correct = answer?.correct_option_ids.includes(option.id);
          return <Pressable key={option.id} accessibilityRole={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'} accessibilityState={{ checked, disabled: !!answer || busy }} onFocus={() => setFocused(option.id)} onBlur={() => setFocused(null)} disabled={!!answer || busy} onPress={() => setSelected(value => question.type === 'MULTIPLE_CHOICE' ? value.includes(option.id) ? value.filter(item => item !== option.id) : [...value, option.id] : [option.id])} style={({ pressed }) => ({ minHeight: 48, padding: spacing.space16, borderRadius: radii.md, borderWidth: focused === option.id ? 2 : 1, borderColor: focused === option.id ? colors.focusRing : checked ? colors.primary : colors.border, backgroundColor: pressed || checked ? colors.surfaceAlt : colors.surface })}><Text style={{ ...typography.body, color: colors.textPrimary }}>{checked ? '✓ ' : ''}{option.label}{correct ? ` · ${t('learning.correctOption')}` : ''}</Text></Pressable>;
        })}</View>
        {!answer ? <Button label={t('learning.checkAnswer')} loading={busy} disabled={!selected.length} onPress={() => { void submit(); }} /> : <>
          <Alert variant={answer.correct ? 'success' : 'info'} message={t(answer.correct ? 'learning.correct' : 'learning.keepLearning')} />
          <ReadingText>{answer.explanation}</ReadingText>
          {enabled && answer.saved ? <ReadingText muted>{t('learning.saved')}</ReadingText> : null}
          <ArticleSources sources={answer.sources ?? []} />
          {answer.claim_id && answer.revision_id ? <>
            <Button label={t('discover.checkResearch')} variant="secondary" onPress={() => setShowEvidence(value => !value)} />
            {showEvidence ? <EvidenceCard claimId={answer.claim_id} expectedRevisionId={answer.revision_id} /> : null}
          </> : null}
        </>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 }}>
          <Button label={t('discover.previous')} variant="secondary" disabled={index === 0 || busy} onPress={() => navigate(index - 1)} />
          <Button label={t(index === quiz.questions.length - 1 ? 'learning.finish' : 'discover.next')} disabled={!answer || busy} onPress={() => { if (index === quiz.questions.length - 1) setFinished(true); else navigate(index + 1); }} />
        </View>
      </> : <ReadingText>{t('learning.unavailable')}</ReadingText>}
    </>}
  </Screen>;
}
