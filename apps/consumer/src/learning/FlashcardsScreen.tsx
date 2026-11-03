import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, LoadingState, Screen } from '../ui';
import EvidenceCard from '../science/EvidenceCard';
import { ReadingCard, ReadingText } from '../science/readingUi';
import { type Claim, type Page } from '../science/scienceApi';
import { learningRequest } from './learningApi';
import ProgressControl from './ProgressControl';

export default function FlashcardsScreen() {
  const { user } = useAuthStatus();
  return <FlashcardDeck key={user?.uid ?? 'guest'} />;
}
function FlashcardDeck() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { getIdToken } = useAuthStatus();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [page, setPage] = useState(0);
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<Page<Claim> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const active = useRef(true);
  const pending = useRef(false);
  const backwards = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false); setIndex(0); setRevealed(false); setShowEvidence(false);
    void learningRequest<Page<Claim>>(`/api/v1/evidence/claims?locale=${locale}&page=${page}&size=20`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) { setData(value); if (backwards.current) { setIndex(Math.max(0, value.items.length - 1)); backwards.current = false; } } })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [locale, page, attempt]);
  const card = data?.items[index];
  async function changeProgress(value: boolean) {
    if (pending.current) return;
    if (!value) { setEnabled(false); setReviewed([]); return; }
    pending.current = true; setBusy(true); setSaveError(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Session unavailable');
      const progress = await learningRequest<string[]>('/api/v1/me/learning/flashcards', { token });
      if (active.current) { setReviewed(progress); setEnabled(true); }
    } catch { if (active.current) setSaveError(true); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  async function remember() {
    if (!card || pending.current) return;
    if (!enabled) { setReviewed(value => [...new Set([...value, card.revision_id])]); return; }
    pending.current = true; setBusy(true); setSaveError(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Session unavailable');
      await learningRequest(`/api/v1/me/learning/flashcards/${card.id}`, { method: 'PUT', token, body: { revisionId: card.revision_id } });
      if (active.current) setReviewed(value => [...new Set([...value, card.revision_id])]);
    } catch { if (active.current) setSaveError(true); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  function move(next: number) { setIndex(next); setRevealed(false); setShowEvidence(false); }
  return <Screen maxWidth={760}>
    <Button label={t('learning.back')} variant="tertiary" onPress={() => router.replace('/science/learn')} />
    <ReadingText heading>{t('learning.flashcards')}</ReadingText>
    <ReadingText muted>{t('learning.flashcardIntro')}</ReadingText>
    <ProgressControl enabled={enabled} busy={busy} onChange={value => { void changeProgress(value); }} />
    {saveError ? <Alert variant="danger" message={t('learning.saveError')} /> : null}
    {error ? <><Alert variant="danger" message={t('learning.loadError')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></> : !data ? <LoadingState label={t('discover.loading')} /> : <>
      {!card ? <ReadingCard><ReadingText>{t('learning.emptyCards')}</ReadingText></ReadingCard> : <>
        <ReadingText muted>{t('learning.position', { current: page * data.size + index + 1, total: data.total })}{reviewed.includes(card.revision_id) ? ` · ${t('learning.reviewedCard')}` : ''}</ReadingText>
        <ReadingCard><ReadingText heading>{card.claim_text}</ReadingText>{!revealed ? <Button label={t('learning.reveal')} onPress={() => setRevealed(true)} /> : <>
          <ReadingText>{card.summary}</ReadingText>
          <ReadingText>{t('discover.certainty')}: {t(`discover.levels.${card.evidence_level}`, { defaultValue: t('discover.notProvided') })}</ReadingText>
          <ReadingText muted>{card.limitations}</ReadingText>
          <Button label={t('learning.remember')} variant="secondary" loading={busy} disabled={reviewed.includes(card.revision_id)} onPress={() => { void remember(); }} />
          <Button label={t('discover.checkResearch')} variant="tertiary" onPress={() => setShowEvidence(value => !value)} />
          {showEvidence ? <EvidenceCard claimId={card.id} expectedRevisionId={card.revision_id} /> : null}
        </>}</ReadingCard>
        <View style={{ flexDirection: 'row', gap: spacing.space8, flexWrap: 'wrap' }}>
          <Button label={t('discover.previous')} variant="secondary" disabled={busy || (index === 0 && page === 0)} onPress={() => { if (index > 0) move(index - 1); else { backwards.current = true; setPage(value => value - 1); } }} />
          <Button label={t('discover.next')} disabled={busy || page * data.size + index + 1 >= data.total} onPress={() => index + 1 < data.items.length ? move(index + 1) : setPage(value => value + 1)} />
          <Button label={t('learning.repeatCard')} variant="tertiary" onPress={() => { setRevealed(false); setShowEvidence(false); }} />
        </View>
      </>}
      <Button label={t('learning.repeatDeck')} variant="secondary" disabled={busy} onPress={() => { setPage(0); move(0); }} />
    </>}
    <ReadingText muted>{t('learning.noPressure')}</ReadingText>
  </Screen>;
}
