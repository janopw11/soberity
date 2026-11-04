import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { ArticleSources, ReadingCard, ReadingText, ResearchLink, RichDocument } from '../science/readingUi';
import EvidenceCard, { useReadingDate } from '../science/EvidenceCard';
import { scienceGet } from '../science/scienceApi';
import type { WeeklyIssue } from './weeklyApi';

export default function WeeklyScienceScreen() {
  const { slug, locale: requestedLocale } = useLocalSearchParams<{ slug: string; locale?: string }>();
  const { t, i18n } = useTranslation();
  const locale = requestedLocale === 'pl' || requestedLocale === 'en' ? requestedLocale : i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  return <WeeklyReader key={`${slug}:${locale}`} slug={slug} locale={locale} />;
}
function WeeklyReader({ slug, locale }: { slug: string; locale: string }) {
  const { t } = useTranslation();
  const date = useReadingDate();
  const [data, setData] = useState<WeeklyIssue | null>(null);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [evidence, setEvidence] = useState(false);
  const [attempt, retry] = useState(0);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(false);
    const timeout = setTimeout(() => { setError(true); controller.abort(); }, 20000);
    void scienceGet<WeeklyIssue>(`/api/v1/discover/weekly/${encodeURIComponent(slug)}?locale=${locale}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [slug, locale, attempt]);
  return <Screen maxWidth={800}>
    {error ? <><Alert variant="danger" message={t('weekly.unavailable')} /><Button label={t('discover.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /></>
      : !data ? <LoadingState label={t('discover.loading')} /> : <>
        <ReadingText heading>{data.title}</ReadingText>
        <ReadingText muted>{data.content_mode === 'NEWS' ? t('weekly.newsLabel') : t(`weekly.kinds.${data.research_kind}`)} · {date(data.publish_at)}</ReadingText>
        {data.content_mode === 'NEWS' ? <>
          {data.document ? <RichDocument node={data.document} /> : null}
          <ArticleSources sources={data.sources ?? []} />
          <ReadingText muted>{t(data.publication_route === 'AUTHOR' ? 'weekly.authorPublication' : 'weekly.reviewedPublication')}</ReadingText>
          {data.publication_route === 'REVIEWED' ? <ReadingText muted>{t('discover.reviewed')}: {date(data.reviewed_at)}</ReadingText> : null}
          <ReadingText muted>{t('discover.nextReview')}: {date(data.next_review_at)}</ReadingText>
        </> : <>

        <ReadingText>{data.teaser}</ReadingText>
        <ReadingCard>
          <ReadingText heading>{data.opening_question}</ReadingText>
          {!revealed ? <Button label={t('weekly.reveal')} onPress={() => setRevealed(true)} /> : <>
            <ReadingText heading>{t('weekly.fields.takeaway')}</ReadingText><ReadingText>{data.takeaway}</ReadingText>
            <ReadingText heading>{t('weekly.fields.established')}</ReadingText><ReadingText>{data.established}</ReadingText>
            <ReadingText heading>{t('weekly.fields.notEstablished')}</ReadingText><ReadingText>{data.not_established}</ReadingText>
          </>}
        </ReadingCard>
        <ReadingCard>
          <ReadingText heading>{t('weekly.fields.method')}</ReadingText><ReadingText>{data.method}</ReadingText>
          <ReadingText heading>{t('weekly.fields.population')}</ReadingText><ReadingText>{data.population}</ReadingText>
          <ReadingText heading>{t('discover.certainty')}: {t(`discover.levels.${data.evidence_level}`)}</ReadingText>
          <ReadingText>{data.evidence_rationale}</ReadingText>
          <ReadingText heading>{t('discover.limitations')}</ReadingText><ReadingText>{data.limitations}</ReadingText><ReadingText>{data.uncertainty}</ReadingText>
          <ReadingText muted>{t('weekly.evidenceReview')}: {date(data.evidence_reviewed_at)}</ReadingText>
          <ReadingText muted>{t('discover.reviewed')}: {date(data.reviewed_at)} · {t('discover.nextReview')}: {date(data.next_review_at)}</ReadingText>
        </ReadingCard>
        <ReadingText heading>{t('discover.checkResearch')}</ReadingText>
        {data.sources?.map((source, index) => <ReadingCard key={`${source.url}:${index}`}>
          <ResearchLink title={source.title} url={source.url} />
          <ReadingText muted>{source.authors} · {source.publication_year} · {t(`discover.studyTypes.${source.study_type}`, { defaultValue: source.study_type ?? t('discover.notProvided') })}</ReadingText>
          <ReadingText muted>{t(`discover.relations.${source.relation}`, { defaultValue: source.relation ?? t('discover.notProvided') })}</ReadingText>
        </ReadingCard>)}
        <Button label={t('weekly.evidence')} variant="secondary" onPress={() => setEvidence(value => !value)} />
        {evidence && data.claim_id && data.revision_id ? <EvidenceCard claimId={data.claim_id} expectedRevisionId={data.revision_id} /> : null}
        </>}
      </>}
  </Screen>;
}
