import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen } from '../ui';
import Svg, { Circle } from 'react-native-svg';
import { SettingsIcon } from '../ui/SettingsIcon';
import EvidenceCard from '../science/EvidenceCard';
import { ArticleSources, ReadingText } from '../science/readingUi';
import {
  learningRequest,
  createQuizAttemptId,
  type QuizCompletion,
  type AnswerResult,
  type Quiz,
  type QuizProgress,
} from './learningApi';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStatus();
  // Remount private state when switching accounts; nothing is stored in browser/device storage.
  return <QuizRunner key={`${id}:${user?.uid ?? 'guest'}`} id={id} />;
}
function QuizRunner({ id }: { id: string }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [hovered, setHovered] = useState<string | null>(null);
  const { getIdToken, status } = useAuthStatus();
  const [attemptId, setAttemptId] = useState(createQuizAttemptId);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [completionError, setCompletionError] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  useEffect(() => {
    const controller = new AbortController();
    setQuiz(null);
    setError(false);
    setResults({});
    setIndex(0);
    setSelected([]);
    setFinished(false);
    setPercentage(null);
    setAttemptId(createQuizAttemptId());
    setCompletionError(false);
    void (async () => {
      const value = await learningRequest<Quiz>(
        `/api/v1/learning/quizzes/${encodeURIComponent(id)}`,
        { signal: controller.signal },
      );
      let restored: Record<string, AnswerResult> = {};
      if (status === 'authenticated') {
        try {
          const token = await getIdToken();
          if (!token) throw new Error('Session unavailable');
          const saved = await learningRequest<QuizProgress>(
            `/api/v1/me/learning/quizzes/${encodeURIComponent(id)}`,
            { token, signal: controller.signal },
          );
          restored = Object.fromEntries(saved.answers.map(item => [item.question_id, item]));
        } catch {
          if (controller.signal.aborted) return;
          // Continue with this run when restoring previous progress fails.
          // Submitted answers still use authenticated automatic saving.
        }
      }
      if (controller.signal.aborted) return;
      setResults(restored);
      const next = value.questions.findIndex(item => !restored[item.id]);
      setIndex(next < 0 ? Math.max(0, value.questions.length - 1) : next);
      setQuiz(value);
    })().catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [id, attempt, status, getIdToken]);
  const question = quiz?.questions[index];
  const answer = question ? results[question.id] : undefined;
  async function submit() {
    if (!question || !selected.length || pending.current) return;
    pending.current = true;
    setBusy(true);
    setSaveError(false);
    try {
      const token = status === 'authenticated' ? await getIdToken() : null;
      if (status === 'authenticated' && !token) throw new Error('Session unavailable');
      const result = await learningRequest<AnswerResult>(
        `/api/v1/learning/quizzes/${encodeURIComponent(id)}/answers`,
        {
          method: 'POST',
          ...(token ? { token } : {}),
          body: {
            questionId: question.id,
            selectedOptionIds: selected,
            saveProgress: status === 'authenticated',
          },
        },
      );
      if (active.current)
        setResults((value) => ({ ...value, [question.id]: result }));
    } catch {
      if (active.current) setSaveError(true);
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }
  async function finish() {
    if (
      !quiz ||
      pending.current ||
      quiz.questions.some((item) => !results[item.id])
    )
      return;
    pending.current = true;
    setBusy(true);
    setCompletionError(false);
    try {
      let score = Math.round(
        (100 *
          quiz.questions.filter((item) => results[item.id]?.correct).length) /
          quiz.questions.length,
      );
      if (status === 'authenticated') {
        const token = await getIdToken();
        if (!token) throw new Error('Session unavailable');
        const saved = await learningRequest<QuizCompletion>(
          `/api/v1/me/learning/quizzes/${encodeURIComponent(id)}/complete`,
          {
            method: 'POST',
            token,
            body: {
              attemptId,
              answers: quiz.questions.map((item) => ({
                questionId: item.id,
                selectedOptionIds: results[item.id]?.selected_option_ids ?? [],
                // Completion reuses the API Answer DTO, which requires this boolean.
                // The completion endpoint stores the result and clears in-progress answers.
                saveProgress: false,
              })),
            },
          },
        );
        score = saved.percentage;
      }
      if (active.current) {
        setPercentage(score);
        setFinished(true);
      }
    } catch {
      if (active.current) setCompletionError(true);
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }
  function navigate(next: number) {
    setIndex(next);
    setSelected([]);
    setShowEvidence(false);
    setSaveError(false);
    setCompletionError(false);
  }
  const answeredCount = quiz?.questions.filter(item => results[item.id]).length ?? 0;
  return (
    <Screen maxWidth={760}>
      {error ? (
        <>
          <Alert variant="danger" message={t('learning.unavailable')} />
          <Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} />
        </>
      ) : !quiz ? <LoadingState label={t('discover.loading')} /> : (
        <>
          <Text accessibilityRole="header" style={styles.quizTitle}>{quiz.title}</Text>
          {quiz.locale !== (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en') ? (
            <ReadingText muted>{t('discover.languageFallback', { language: quiz.locale })}</ReadingText>
          ) : null}
          {completionError ? <Alert variant="danger" message={t('learning.completionSaveError')} /> : null}
          {saveError ? <Alert variant="danger" message={t('learning.answerError')} /> : null}
          {finished ? (
            <View style={styles.resultCard}>
              <View style={styles.scoreRing} accessibilityRole="image" accessibilityLabel={t('learning.resultPercentage', { percentage })}>
                <Svg width={160} height={160} viewBox="0 0 160 160" accessible={false}>
                  <Circle cx={80} cy={80} r={70} fill="none" stroke={colors.surfaceAlt} strokeWidth={10} />
                  <Circle cx={80} cy={80} r={70} fill="none" stroke={colors.primary} strokeWidth={10}
                    strokeDasharray={`${2 * Math.PI * 70}`} strokeDashoffset={2 * Math.PI * 70 * (1 - (percentage ?? 0) / 100)}
                    strokeLinecap="round" rotation={-90} origin="80, 80" />
                </Svg>
                <Text style={styles.scoreText}>{percentage}%</Text>
              </View>
              <Text accessibilityRole="header" style={styles.resultTitle}>{t('learning.complete')}</Text>
              <Text style={styles.resultSummary}>{t('learning.summary', {
                correct: quiz.questions.filter(item => results[item.id]?.correct).length,
                total: quiz.questions.length,
              })}</Text>
              <Text style={styles.resultNote}>{t('learning.repeatNote')}</Text>
              <Button label={t('learning.repeat')} style={styles.repeatButton} onPress={() => {
                setResults({}); navigate(0); setFinished(false); setPercentage(null);
                setAttemptId(createQuizAttemptId()); setCompletionError(false);
              }} />
              <Button label={t('learning.discoverQuizzes')} variant="secondary"
                style={styles.discoverButton} onPress={() => router.replace('/science/quizzes')} />
            </View>
          ) : question ? (
            <>
              <View style={styles.progressSection}>
                <View style={styles.metaRow}>
                  <Text style={styles.progressLabel}>{t('learning.questionPosition', { current: index + 1, total: quiz.questions.length })}</Text>
                  <Text style={styles.progressCount}>{t('learning.answeredCount', { count: answeredCount, total: quiz.questions.length })}</Text>
                </View>
                <View accessibilityRole="progressbar" accessibilityLabel={t('learning.quizProgress')}
                  accessibilityValue={{ min: 0, max: quiz.questions.length, now: answeredCount }} style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${100 * answeredCount / Math.max(1, quiz.questions.length)}%` }]} />
                </View>
              </View>
              <View style={styles.questionCard}>
                <View style={styles.typeBadge}><Text style={styles.typeLabel}>{t(`learning.types.${question.type}`)}</Text></View>
                <Text accessibilityRole="header" style={styles.questionTitle}>{question.prompt}</Text>
                <Text style={styles.instruction}>{t(question.type === 'MULTIPLE_CHOICE' ? 'learning.selectMany' : 'learning.selectOne')}</Text>
                <View accessibilityRole={question.type === 'MULTIPLE_CHOICE' ? undefined : 'radiogroup'} accessibilityLabel={question.prompt} style={styles.options}>
                  {question.options.map((option, optionIndex) => {
                    const checked = answer ? answer.selected_option_ids.includes(option.id) : selected.includes(option.id);
                    const correct = Boolean(answer?.correct_option_ids.includes(option.id));
                    const incorrect = Boolean(answer && checked && !correct);
                    const accent = correct ? colors.success : incorrect ? colors.danger : checked ? colors.primary : colors.textMuted;
                    return (
                      <Pressable key={option.id}
                        accessibilityRole={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                        accessibilityState={{ checked, disabled: !!answer || busy }}
                        onFocus={() => setFocused(option.id)} onBlur={() => setFocused(null)}
                        onHoverIn={() => setHovered(option.id)} onHoverOut={() => setHovered(null)}
                        disabled={!!answer || busy}
                        onPress={() => setSelected(value => question.type === 'MULTIPLE_CHOICE'
                          ? value.includes(option.id) ? value.filter(item => item !== option.id) : [...value, option.id]
                          : [option.id])}
                        style={({ pressed }) => [styles.option, {
                          borderColor: focused === option.id ? colors.focusRing : correct || incorrect || checked || hovered === option.id ? accent : colors.border,
                          backgroundColor: correct ? colors.quizHighSurface : incorrect ? colors.quizLowSurface : checked || pressed || hovered === option.id ? colors.surfaceAlt : colors.surface,
                          transform: [{ scale: pressed ? 0.99 : 1 }],
                        }]}>
                        <View style={[styles.optionMarker, {
                          borderRadius: question.type === 'MULTIPLE_CHOICE' ? radii.sm : radii.pill,
                          backgroundColor: checked && !answer ? colors.primary : colors.surfaceAlt,
                        }]}>
                          {correct || checked && !answer ? <SettingsIcon name="check" color={checked && !answer ? colors.onPrimary : accent} size={20} />
                            : incorrect ? <SettingsIcon name="close" color={accent} size={20} />
                            : <Text style={[styles.optionLetter, { color: accent }]}>{String.fromCharCode(65 + optionIndex)}</Text>}
                        </View>
                        <View style={styles.optionCopy}>
                          <Text style={[styles.optionText, { color: checked || correct ? accent : colors.textPrimary }]}>{option.label}</Text>
                          {correct ? <Text style={[styles.optionCaption, { color: colors.success }]}>{t('learning.correctOption')}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.actions}>
                <Button label={t('discover.previous')} variant="tertiary" disabled={index === 0 || busy} onPress={() => navigate(index - 1)} style={styles.previousButton} />
                <Button label={t(!answer ? 'learning.checkAnswer' : index === quiz.questions.length - 1 ? 'learning.finish' : 'discover.next')}
                  loading={busy} disabled={!answer && !selected.length} style={styles.primaryButton}
                  onPress={() => { if (!answer) void submit(); else if (index === quiz.questions.length - 1) void finish(); else navigate(index + 1); }} />
              </View>
              {answer ? (
                <View style={[styles.feedback, { borderColor: answer.correct ? colors.success : colors.primary }]} accessibilityLiveRegion="polite">
                  <View style={styles.feedbackHeading}>
                    <SettingsIcon name={answer.correct ? 'check' : 'question'} color={answer.correct ? colors.success : colors.primary} size={24} />
                    <Text accessibilityRole="header" style={[styles.feedbackTitle, { color: answer.correct ? colors.success : colors.primary }]}>
                      {t(answer.correct ? 'learning.correct' : 'learning.explanationTitle')}
                    </Text>
                  </View>
                  <ReadingText>{answer.explanation}</ReadingText>
                  <ArticleSources sources={answer.sources ?? []} />
                  {answer.claim_id && answer.revision_id ? (
                    <>
                      <Button label={t('discover.checkResearch')} variant="secondary" onPress={() => setShowEvidence(value => !value)} />
                      {showEvidence ? <EvidenceCard claimId={answer.claim_id} expectedRevisionId={answer.revision_id} /> : null}
                    </>
                  ) : null}
                </View>
              ) : null}

            </>
          ) : <ReadingText>{t('learning.unavailable')}</ReadingText>}
        </>
      )}
    </Screen>
  );
}

function createStyles(colors: ReturnType<typeof useThemePreferences>['colors']) {
  return StyleSheet.create({
    quizTitle: { ...typography.h3, color: colors.primary, textAlign: 'center' },
    progressSection: { gap: spacing.space12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.space8 },
    progressLabel: { ...typography.label, color: colors.primary },
    progressCount: { ...typography.small, color: colors.textMuted },
    progressTrack: { height: spacing.space8, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.primary },
    questionCard: { padding: spacing.space24, borderRadius: radii.xl, backgroundColor: colors.listSurface, borderWidth: 1, borderColor: colors.border, gap: spacing.space16 },
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.space12, paddingVertical: spacing.space4, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt, maxWidth: '100%' },
    typeLabel: { ...typography.caption, color: colors.primary },
    questionTitle: { ...typography.h2, color: colors.textPrimary },
    instruction: { ...typography.small, color: colors.textSecondary },
    options: { gap: spacing.space12 },
    option: { minHeight: 64, padding: spacing.space12, borderRadius: radii.lg, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: spacing.space12 },
    optionMarker: { width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    optionLetter: { ...typography.label },
    optionCopy: { flex: 1, minWidth: 0, gap: spacing.space4 },
    optionText: { ...typography.bodyStrong },
    optionCaption: { ...typography.caption },
    feedback: { padding: spacing.space24, borderRadius: radii.xl, borderWidth: 1, backgroundColor: colors.surface, gap: spacing.space16 },
    feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.space12 },
    feedbackTitle: { ...typography.bodyStrong, flex: 1 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.space12 },
    previousButton: { flexGrow: 1, flexBasis: 100 },
    primaryButton: { flexGrow: 2, flexBasis: 160, minHeight: 56, borderRadius: radii.pill },
    resultCard: { alignItems: 'center', padding: spacing.space24, borderRadius: radii.xl, backgroundColor: colors.listSurface, borderWidth: 1, borderColor: colors.border, gap: spacing.space16 },
    scoreRing: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
    scoreText: { ...typography.display, color: colors.primary, position: 'absolute' },
    resultTitle: { ...typography.h2, color: colors.primary, textAlign: 'center' },
    resultSummary: { ...typography.bodyStrong, color: colors.textPrimary, textAlign: 'center' },
    resultNote: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
    discoverButton: { alignSelf: 'stretch', minHeight: 56, borderRadius: radii.pill },
    repeatButton: { alignSelf: 'stretch', minHeight: 56, borderRadius: radii.pill, marginTop: spacing.space8 },
  });
}
