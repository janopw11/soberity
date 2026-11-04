import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import { ArticleSources, ReadingCard, ReadingText } from '../science/readingUi';
import EvidenceCard, { useReadingDate } from '../science/EvidenceCard';
import { researchUrl, type Page } from '../science/scienceApi';
import { type Membership } from '../editorial/editorialApi';
import QuizPresentationFields, {
  type QuizPresentation,
} from './QuizPresentationFields.web';
import {
  learningRequest,
  type QuizQuestion,
  type QuizSource,
} from './learningApi';

type EditableQuestion = {
  id: string;
  type: QuizQuestion['type'];
  prompt: string;
  explanation: string;
  claimId?: string | null;
  revisionId?: string | null;
  sources: QuizSource[];
  options: { id: string; label: string; correct: boolean }[];
};
type EditorialQuiz = {
  id: string;
  title: string;
  locale: string;
  status: string;
  author_uid: string;
  category_code: QuizPresentation['categoryCode'];
  cover_id: string | null;
  presentation_version: number;
  review_notes: string | null;
  definition?: { questions: EditableQuestion[] };
  audit?: { action: string; notes: string; created_at: string }[];
};
function newQuestion(locale: string): EditableQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'TRUE_FALSE',
    prompt: '',
    explanation: '',
    sources: [{ title: '', url: '' }],
    options: [
      {
        id: crypto.randomUUID(),
        label: locale === 'pl' ? 'Prawda' : 'True',
        correct: true,
      },
      {
        id: crypto.randomUUID(),
        label: locale === 'pl' ? 'Fałsz' : 'False',
        correct: false,
      },
    ],
  };
}
export default function QuizEditorialScreen() {
  const { user } = useAuthStatus();
  return <QuizEditorialWorkspace key={`source-links:${user?.uid}`} />;
}
function QuizEditorialWorkspace() {
  const { t, i18n } = useTranslation();
  const date = useReadingDate();
  const { getIdToken, user } = useAuthStatus();
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [items, setItems] = useState<Page<EditorialQuiz> | null>(null);
  const [detail, setDetail] = useState<EditorialQuiz | null>(null);
  const [locale, setLocale] = useState(
    i18n.resolvedLanguage === 'pl' ? 'pl' : 'en',
  );
  const [title, setTitle] = useState('');
  const [presentation, setPresentation] = useState<QuizPresentation>({
    categoryCode: 'brain',
    coverId: null,
  });
  const [detailPresentation, setDetailPresentation] =
    useState<QuizPresentation>({ categoryCode: 'brain', coverId: null });
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, retry] = useState(0);
  const [success, setSuccess] = useState(false);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (questions.length || title.trim()) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [questions.length, title]);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    setItems(null);
    void (async () => {
      const token = await getIdToken();
      if (!token) throw new Error('No session');
      const [roles, list] = await Promise.all([
        learningRequest<Membership>('/api/v1/editorial/me', {
          token,
          signal: controller.signal,
        }),
        learningRequest<Page<EditorialQuiz>>(
          `/api/v1/editorial/quizzes?page=${page}`,
          { token, signal: controller.signal },
        ),
      ]);
      if (!controller.signal.aborted) {
        setMembership(roles);
        setItems(list);
      }
    })().catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [getIdToken, page, attempt]);
  const patch = (id: string, update: Partial<EditableQuestion>) =>
    setQuestions((value) =>
      value.map((question) =>
        question.id === id ? { ...question, ...update } : question,
      ),
    );
  const canCreate = membership?.roles.includes('AUTHOR');
  const canReview = membership?.roles.includes('REVIEWER');
  const complete =
    !uploading &&
    !!title.trim() &&
    questions.length > 0 &&
    questions.every(
      (question) =>
        question.prompt.trim() &&
        question.explanation.trim() &&
        question.sources.length > 0 &&
        question.sources.every(
          (source) => source.title.trim() && researchUrl(source.url),
        ) &&
        question.options.every((option) => option.label.trim()) &&
        question.options.some((option) => option.correct) &&
        question.options.some((option) => !option.correct),
    );
  const act = useCallback(
    async (action: (token: string) => Promise<void>) => {
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setError(false);
      setSuccess(false);
      try {
        const token = await getIdToken();
        if (!token) throw new Error('No session');
        await action(token);
      } catch {
        if (mounted.current) setError(true);
      } finally {
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [getIdToken],
  );
  async function open(id: string) {
    await act(async (token) => {
      const result = await learningRequest<EditorialQuiz>(
        `/api/v1/editorial/quizzes/${id}`,
        { token },
      );
      if (mounted.current) {
        setDetail(result);
        setDetailPresentation({
          categoryCode: result.category_code ?? 'alco-facts',
          coverId: result.cover_id ?? null,
        });
        setNotes('');
      }
    });
  }
  async function publishExisting(id: string) {
    await act(async (token) => {
      await learningRequest(`/api/v1/editorial/quizzes/${id}/decision`, {
        method: 'POST',
        token,
        body: {
          action: 'AUTHOR_PUBLISH',
          notes: t('learning.editor.directNote'),
        },
      });
      if (mounted.current) {
        setDetail(null);
        setSuccess(true);
        retry((value) => value + 1);
      }
    });
  }
  async function submit(action: 'REVIEW' | 'PUBLISH') {
    await act(async (token) => {
      await learningRequest('/api/v1/editorial/quizzes', {
        method: 'POST',
        token,
        body: { locale, title, questions, action, ...presentation },
      });
      if (mounted.current) {
        setQuestions([]);
        setTitle('');
        setPresentation({ categoryCode: 'brain', coverId: null });
        setSuccess(true);
        retry((value) => value + 1);
      }
    });
  }
  async function decide(action: string) {
    if (!detail) return;
    await act(async (token) => {
      await learningRequest(`/api/v1/editorial/quizzes/${detail.id}/decision`, {
        method: 'POST',
        token,
        body: {
          action,
          notes:
            action === 'AUTHOR_PUBLISH'
              ? t('learning.editor.directNote')
              : notes,
        },
      });
      if (mounted.current) {
        setDetail(null);
        setNotes('');
        setSuccess(true);
        retry((value) => value + 1);
      }
    });
  }
  return (
    <Screen maxWidth={900}>
      <Button
        label={t('learning.editor.back')}
        variant="tertiary"
        onPress={() => {
          if (
            !(questions.length || title.trim()) ||
            window.confirm(t('learning.editor.discard'))
          )
            router.replace('/editorial');
        }}
      />
      <ReadingText heading>{t('learning.editor.title')}</ReadingText>
      <ReadingText muted>{t('learning.editor.reviewPolicy')}</ReadingText>
      {error ? (
        <>
          <Alert variant="danger" message={t('learning.editor.error')} />
          <Button
            label={t('discover.retry')}
            variant="secondary"
            onPress={() => retry((value) => value + 1)}
          />
        </>
      ) : null}
      {success ? (
        <Alert variant="success" message={t('learning.editor.success')} />
      ) : null}
      {!items && !error ? <LoadingState label={t('discover.loading')} /> : null}
      {items ? (
        <>
          {items.items.length === 0 ? (
            <ReadingText muted>{t('learning.emptyQuizzes')}</ReadingText>
          ) : (
            items.items.map((item) => (
              <ReadingCard key={item.id}>
                <ReadingText heading>{item.title}</ReadingText>
                <ReadingText muted>
                  {item.locale} ·{' '}
                  {t(`learning.statuses.${item.status}`, {
                    defaultValue: item.status,
                  })}
                </ReadingText>
                {canCreate &&
                item.author_uid === membership?.uid &&
                item.status === 'IN_REVIEW' ? (
                  <Button
                    label={t('learning.editor.publishDirect')}
                    disabled={busy}
                    onPress={() => {
                      void publishExisting(item.id);
                    }}
                  />
                ) : null}
                <Button
                  label={t('learning.editor.inspect')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => {
                    void open(item.id);
                  }}
                />
              </ReadingCard>
            ))
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.space8,
              flexWrap: 'wrap',
            }}
          >
            <Button
              label={t('discover.previous')}
              variant="secondary"
              disabled={page === 0 || busy}
              onPress={() => setPage((value) => value - 1)}
            />
            <Button
              label={t('discover.next')}
              variant="secondary"
              disabled={busy || (page + 1) * items.size >= items.total}
              onPress={() => setPage((value) => value + 1)}
            />
          </View>
        </>
      ) : null}
      {detail?.definition ? (
        <ReadingCard>
          <ReadingText heading>{detail.title}</ReadingText>
          {canCreate &&
          detail.author_uid === user?.uid &&
          detail.status !== 'ARCHIVED' ? (
            <>
              <QuizPresentationFields
                key={`${detail.id}:${detail.presentation_version}`}
                value={detailPresentation}
                onChange={setDetailPresentation}
                disabled={busy || uploading}
                onUploadingChange={setUploading}
              />
              <Button
                label={t('learning.savePresentation')}
                disabled={busy || uploading}
                onPress={() => {
                  void act(async (token) => {
                    const updated = await learningRequest<EditorialQuiz>(
                      `/api/v1/editorial/quizzes/${detail.id}/presentation`,
                      {
                        method: 'PUT',
                        token,
                        body: {
                          ...detailPresentation,
                          expectedVersion: detail.presentation_version,
                        },
                      },
                    );
                    if (mounted.current) {
                      setDetail(updated);
                      setDetailPresentation({
                        categoryCode: updated.category_code,
                        coverId: updated.cover_id,
                      });
                      setSuccess(true);
                      retry((value) => value + 1);
                    }
                  });
                }}
              />
            </>
          ) : null}
          {detail.definition.questions.map((question) => (
            <ReadingCard key={question.id}>
              <ReadingText heading>{question.prompt}</ReadingText>
              {question.options.map((option) => (
                <ReadingText key={option.id}>
                  {option.correct ? '✓ ' : ''}
                  {option.label}
                </ReadingText>
              ))}
              <ReadingText>{question.explanation}</ReadingText>
              <ArticleSources sources={question.sources ?? []} />
              {question.claimId && question.revisionId ? (
                <EvidenceCard
                  claimId={question.claimId}
                  expectedRevisionId={question.revisionId}
                />
              ) : null}
            </ReadingCard>
          ))}
          {detail.review_notes ? (
            <ReadingText>{detail.review_notes}</ReadingText>
          ) : null}
          {detail.audit?.map((event, index) => (
            <ReadingText muted key={index}>
              {date(event.created_at)} ·{' '}
              {t(`learning.actions.${event.action}`, {
                defaultValue: event.action,
              })}{' '}
              · {event.notes}
            </ReadingText>
          ))}
          {detail.status !== 'ARCHIVED' ? (
            <>
              <TextField
                accentLabel
                label={t('learning.editor.notes')}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={4000}
                editable={!busy}
              />
              {canCreate &&
              detail.author_uid === user?.uid &&
              detail.status === 'IN_REVIEW' ? (
                <Button
                  label={t('learning.editor.publishDirect')}
                  disabled={busy}
                  loading={busy}
                  onPress={() => {
                    void decide('AUTHOR_PUBLISH');
                  }}
                />
              ) : null}
              {canReview &&
              detail.author_uid !== user?.uid &&
              detail.status === 'IN_REVIEW' ? (
                <Button
                  label={t('learning.editor.publish')}
                  disabled={busy || !notes.trim()}
                  loading={busy}
                  onPress={() => {
                    void decide('PUBLISH');
                  }}
                />
              ) : null}
              {canReview || (canCreate && detail.author_uid === user?.uid) ? (
                <Button
                  label={t('learning.editor.archive')}
                  variant="secondary"
                  disabled={busy || !notes.trim()}
                  onPress={() => {
                    if (window.confirm(t('learning.editor.archiveConfirm')))
                      void decide('ARCHIVE');
                  }}
                />
              ) : null}
            </>
          ) : null}
          <Button
            label={t('learning.editor.close')}
            variant="tertiary"
            onPress={() => setDetail(null)}
          />
        </ReadingCard>
      ) : null}
      {canCreate ? (
        <ReadingCard>
          <ReadingText heading>{t('learning.editor.newQuiz')}</ReadingText>
          <TextField
            accentLabel
            label={t('learning.editor.quizTitle')}
            value={title}
            onChangeText={setTitle}
            maxLength={300}
            editable={!busy}
          />
          <QuizPresentationFields
            value={presentation}
            onChange={setPresentation}
            disabled={busy || uploading}
            onUploadingChange={setUploading}
          />
          <ReadingText>{t('learning.editor.language')}</ReadingText>
          <View style={{ flexDirection: 'row', gap: spacing.space8 }}>
            {['en', 'pl'].map((value) => (
              <Button
                key={value}
                label={`${locale === value ? '✓ ' : ''}${value === 'en' ? 'English' : 'Polski'}`}
                variant={locale === value ? 'primary' : 'secondary'}
                disabled={busy || questions.length > 0}
                onPress={() => setLocale(value)}
              />
            ))}
          </View>
          {questions.map((question, questionIndex) => (
            <ReadingCard key={question.id}>
              <ReadingText heading>
                {t('learning.editor.question', { count: questionIndex + 1 })}
              </ReadingText>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.space8,
                }}
              >
                {(
                  ['TRUE_FALSE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'] as const
                ).map((type) => (
                  <Button
                    key={type}
                    label={`${question.type === type ? '✓ ' : ''}${t(`learning.types.${type}`)}`}
                    variant={question.type === type ? 'primary' : 'secondary'}
                    disabled={busy}
                    onPress={() =>
                      patch(question.id, {
                        type,
                        options:
                          type === 'TRUE_FALSE'
                            ? newQuestion(locale).options
                            : question.options.map((option) => ({
                                ...option,
                                correct: false,
                              })),
                      })
                    }
                  />
                ))}
              </View>
              <TextField
                accentLabel
                label={t('learning.editor.prompt')}
                value={question.prompt}
                onChangeText={(value) => patch(question.id, { prompt: value })}
                multiline
                maxLength={2000}
                editable={!busy}
              />
              {question.options.map((option, optionIndex) => (
                <View key={option.id} style={{ gap: spacing.space8 }}>
                  <TextField
                    accentLabel
                    label={t('learning.editor.option', {
                      count: optionIndex + 1,
                    })}
                    value={option.label}
                    onChangeText={(label) =>
                      patch(question.id, {
                        options: question.options.map((item) =>
                          item.id === option.id ? { ...item, label } : item,
                        ),
                      })
                    }
                    maxLength={500}
                    editable={!busy && question.type !== 'TRUE_FALSE'}
                  />
                  <Button
                    label={`${option.correct ? '✓ ' : ''}${t('learning.editor.markCorrect')}`}
                    variant={option.correct ? 'primary' : 'secondary'}
                    disabled={busy}
                    onPress={() =>
                      patch(question.id, {
                        options: question.options.map((item) => ({
                          ...item,
                          correct:
                            question.type === 'MULTIPLE_CHOICE'
                              ? item.id === option.id
                                ? !item.correct
                                : item.correct
                              : item.id === option.id,
                        })),
                      })
                    }
                  />
                  {question.type !== 'TRUE_FALSE' &&
                  question.options.length > 2 ? (
                    <Button
                      label={t('learning.editor.removeOption')}
                      variant="tertiary"
                      disabled={busy}
                      onPress={() =>
                        patch(question.id, {
                          options: question.options.filter(
                            (item) => item.id !== option.id,
                          ),
                        })
                      }
                    />
                  ) : null}
                </View>
              ))}
              {question.type !== 'TRUE_FALSE' && question.options.length < 6 ? (
                <Button
                  label={t('learning.editor.addOption')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() =>
                    patch(question.id, {
                      options: [
                        ...question.options,
                        { id: crypto.randomUUID(), label: '', correct: false },
                      ],
                    })
                  }
                />
              ) : null}
              <TextField
                accentLabel
                label={t('learning.editor.explanation')}
                helperText={t('learning.editor.explanationHint')}
                value={question.explanation}
                onChangeText={(value) =>
                  patch(question.id, { explanation: value })
                }
                multiline
                maxLength={6000}
                editable={!busy}
              />
              <ReadingText>{t('learning.editor.sources')}</ReadingText>
              {question.sources.map((source, sourceIndex) => (
                <View key={sourceIndex} style={{ gap: spacing.space8 }}>
                  <TextField
                    accentLabel
                    label={t('learning.editor.sourceTitle')}
                    value={source.title}
                    maxLength={500}
                    editable={!busy}
                    onChangeText={(title) =>
                      patch(question.id, {
                        sources: question.sources.map((item, index) =>
                          index === sourceIndex ? { ...item, title } : item,
                        ),
                      })
                    }
                  />
                  <TextField
                    accentLabel
                    label={t('learning.editor.sourceUrl')}
                    helperText={t('learning.editor.sourceHint')}
                    value={source.url}
                    maxLength={2000}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    editable={!busy}
                    onChangeText={(url) =>
                      patch(question.id, {
                        sources: question.sources.map((item, index) =>
                          index === sourceIndex ? { ...item, url } : item,
                        ),
                      })
                    }
                  />
                  {question.sources.length > 1 ? (
                    <Button
                      label={t('learning.editor.removeSource')}
                      variant="tertiary"
                      disabled={busy}
                      onPress={() =>
                        patch(question.id, {
                          sources: question.sources.filter(
                            (_, index) => index !== sourceIndex,
                          ),
                        })
                      }
                    />
                  ) : null}
                </View>
              ))}
              {question.sources.length < 10 ? (
                <Button
                  label={t('learning.editor.addSource')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() =>
                    patch(question.id, {
                      sources: [...question.sources, { title: '', url: '' }],
                    })
                  }
                />
              ) : null}
              <Button
                label={t('learning.editor.removeQuestion')}
                variant="tertiary"
                disabled={busy}
                onPress={() =>
                  setQuestions((value) =>
                    value.filter((item) => item.id !== question.id),
                  )
                }
              />
            </ReadingCard>
          ))}
          <Button
            label={t('learning.editor.addQuestion')}
            variant="secondary"
            disabled={busy || questions.length >= 30}
            onPress={() =>
              setQuestions((value) => [...value, newQuestion(locale)])
            }
          />
          {!complete ? (
            <ReadingText muted>
              {t('learning.editor.requiredFields')}
            </ReadingText>
          ) : null}
          <Button
            label={t('learning.editor.publishDirect')}
            disabled={busy || !complete}
            loading={busy}
            onPress={() => {
              void submit('PUBLISH');
            }}
          />
          <Button
            label={t('learning.editor.submit')}
            variant="secondary"
            disabled={busy || !complete}
            onPress={() => {
              void submit('REVIEW');
            }}
          />
        </ReadingCard>
      ) : null}
    </Screen>
  );
}
