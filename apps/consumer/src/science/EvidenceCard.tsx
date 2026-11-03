import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, LoadingState } from '../ui';
import { ReadingCard, ReadingText, ResearchLink } from './readingUi';
import { ScienceError, scienceGet, type Claim, type Source } from './scienceApi';

export function useReadingDate() {
  const { i18n, t } = useTranslation();
  return (value: string | null | undefined) => {
    if (!value || Number.isNaN(Date.parse(value))) return t('discover.notProvided');
    return new Intl.DateTimeFormat(i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
  };
}
export default function EvidenceCard({ claimId }: { claimId: string }) {
  const { t } = useTranslation();
  const date = useReadingDate();
  const [data, setData] = useState<{ claim: Claim; sources: Source[] } | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [attempt, retry] = useState(0);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(null);
    const timeout = setTimeout(() => controller.abort(), 20000);
    void Promise.all([
      scienceGet<Claim>(`/api/v1/evidence/claims/${encodeURIComponent(claimId)}`, controller.signal),
      scienceGet<Source[]>(`/api/v1/evidence/claims/${encodeURIComponent(claimId)}/citations`, controller.signal),
    ]).then(([claim, sources]) => { if (!controller.signal.aborted) setData({ claim, sources }); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof ScienceError ? reason.status : 0); })
      .finally(() => clearTimeout(timeout));
    // A timeout is visible and retryable; cleanup cancellation stays silent.
    const onAbort = () => setError(0);
    controller.signal.addEventListener('abort', onAbort);
    return () => { clearTimeout(timeout); controller.signal.removeEventListener('abort', onAbort); controller.abort(); };
  }, [claimId, attempt]);
  if (error !== null) return <ReadingCard><ReadingText heading>{t('discover.evidence')}</ReadingText><ReadingText>{t(error === 404 ? 'discover.evidenceUnavailable' : 'discover.error')}</ReadingText><Button variant="secondary" label={t('discover.retry')} onPress={() => retry(value => value + 1)} /></ReadingCard>;
  if (!data) return <LoadingState label={t('discover.loadingEvidence')} />;
  const { claim, sources } = data;
  const levelKey = `discover.levels.${claim.evidence_level}`;
  return <ReadingCard>
    <ReadingText heading>{t('discover.evidence')}</ReadingText>
    <ReadingText heading>{claim.claim_text}</ReadingText>
    <ReadingText>{claim.summary}</ReadingText>
    <ReadingText>{t('discover.certainty')}: {t(levelKey, { defaultValue: t('discover.notProvided') })}</ReadingText>
    <ReadingText muted>{claim.evidence_rationale || t('discover.notProvided')}</ReadingText>
    <ReadingText heading>{t('discover.scope')}</ReadingText>
    <ReadingText>{t('discover.population')}: {claim.population || t('discover.notProvided')}</ReadingText>
    <ReadingText>{t('discover.exposure')}: {claim.exposure || t('discover.notProvided')}</ReadingText>
    <ReadingText>{t('discover.outcome')}: {claim.outcome || t('discover.notProvided')}</ReadingText>
    <ReadingText>{t('discover.inference')}: {t(`discover.inferences.${claim.inference_type}`, { defaultValue: t('discover.notProvided') })}</ReadingText>
    <ReadingText heading>{t('discover.limitations')}</ReadingText>
    <ReadingText>{claim.limitations || t('discover.notProvided')}</ReadingText>
    <ReadingText>{claim.uncertainty || t('discover.notProvided')}</ReadingText>
    <ReadingText muted>{t('discover.reviewed')}: {date(claim.reviewed_at)} · {t('discover.nextReview')}: {date(claim.next_review_at)}</ReadingText>
    {claim.next_review_at && Date.parse(claim.next_review_at) < Date.now() ? <ReadingText>{t('discover.reviewDue')}</ReadingText> : null}
    <ReadingText muted>{t('discover.version', { count: claim.version })}</ReadingText>
    <ReadingText heading>{t('discover.checkResearch')}</ReadingText>
    {sources.length === 0 ? <ReadingText>{t('discover.evidenceUnavailable')}</ReadingText> : sources.map(source => <ReadingCard key={source.id}>
      <ResearchLink title={source.title} url={source.url} />
      <ReadingText muted>{[source.authors, source.organization, source.journal].filter(Boolean).join(' · ')}</ReadingText>
      <ReadingText>{t('discover.year')}: {source.publication_year ?? t('discover.notProvided')} · {t('discover.sourceType')}: {t(`discover.studyTypes.${source.study_type}`, { defaultValue: source.study_type || t('discover.notProvided') })}</ReadingText>
      {source.doi ? <ResearchLink title={`DOI: ${source.doi}`} url={`https://doi.org/${source.doi}`} /> : null}
      {source.pmid ? <ResearchLink title={`PMID: ${source.pmid}`} url={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(source.pmid)}/`} /> : null}
      {source.relation ? <ReadingText muted>{t('discover.relation')}: {t(`discover.relations.${source.relation}`, { defaultValue: source.relation })}</ReadingText> : null}
      {source.notes ? <ReadingText muted>{source.notes}</ReadingText> : null}
    </ReadingCard>)}
  </ReadingCard>;
}
