import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { ArticleSources, ReadingCard, ReadingText, RichDocument } from '../science/readingUi';
import { scienceGet, type Page, type Post } from '../science/scienceApi';
import { learningRequest, LearningError } from '../learning/learningApi';
import EditorialSelect from '../editorial/EditorialSelect';
import type { WeeklyIssue } from './weeklyApi';

type Feature = { id: string; post_id: string; locale: string; starts_at: string; title: string; available: boolean };
function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export default function WeeklyEditorialScreen() {
  const { user } = useAuthStatus();
  return <Workspace key={user?.uid ?? 'guest'} />;
}
function Workspace() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const router = useRouter();
  const dateId = useId();
  const pending = useRef(false);
  const [locale, setLocale] = useState(i18n.resolvedLanguage === 'pl' ? 'pl' : 'en');
  const [postId, setPostId] = useState('');
  const [startsAt, setStartsAt] = useState(() => localInput(new Date(Date.now()+86400000)));
  const [articles, setArticles] = useState<Page<Post> | null>(null);
  const [features, setFeatures] = useState<Page<Feature> | null>(null);
  const [page, setPage] = useState(0);
  const [featurePage, setFeaturePage] = useState(0);
  const [attempt, retry] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(false);
  const [history, setHistory] = useState(false);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController(); setError(null); setFeatures(null); setArticles(null);
    const timeout = setTimeout(() => { setError('weekly.featureError'); controller.abort(); }, 20000);
    void (async () => {
      const token = await getIdToken(); if (!token) throw new Error('Session unavailable');
      const [choices, queue] = await Promise.all([
        scienceGet<Page<Post>>(`/api/v1/science/posts?kind=ARTICLE&page=${page}`, controller.signal),
        learningRequest<Page<Feature>>(`/api/v1/editorial/weekly/features?page=${featurePage}`, { token, signal: controller.signal }),
      ]);
      if (!controller.signal.aborted) { setArticles(choices); setFeatures(queue); }
    })().catch(e => { if (!controller.signal.aborted) setError(e instanceof LearningError && [401,403].includes(e.status) ? 'weekly.denied' : 'weekly.featureError'); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [page, featurePage, attempt, getIdToken]);
  async function run(action: (token: string) => Promise<unknown>) {
    if (pending.current) return; pending.current=true; setBusy(true); setError(null); setNotice(false);
    try {
      const token = await getIdToken(); if (!token) throw new Error('Session unavailable');
      await action(token); setNotice(true); retry(value => value+1);
    } catch { setError('weekly.featureError'); }
    finally { pending.current=false; setBusy(false); }
  }
  function select(now: boolean) {
    if (!postId) { setError('weekly.chooseArticle'); return; }
    const instant = new Date(startsAt);
    if (!now && (!Number.isFinite(instant.getTime()) || localInput(instant)!==startsAt || instant.getTime()<=Date.now())) { setError('weekly.futureDate'); return; }
    void run(token => learningRequest('/api/v1/editorial/weekly/features', { method: 'POST', token, body: { postId, locale, startsAt: now ? null : instant.toISOString() } }));
  }
  return <Screen maxWidth={900}>
    <ReadingText heading>{t('weekly.articleOfWeek')}</ReadingText>
    <ReadingText muted>{t('weekly.featureIntro')}</ReadingText>
    {error ? <><Alert variant="danger" message={t(error)} /><Button label={t('discover.retry')} variant="secondary" disabled={busy} onPress={() => retry(value => value+1)} /></> : null}
    {notice ? <Alert variant="success" message={t('weekly.featureSaved')} /> : null}
    {!features || !articles ? !error ? <LoadingState label={t('discover.loading')} /> : null : <>
      <ReadingCard>
        <EditorialSelect label={t('weekly.featureLanguage')} value={locale} onChange={setLocale} disabled={busy} options={[{value:'en',label:'English'},{value:'pl',label:'Polski'}]} />
        <ReadingText muted>{t('weekly.languageHelp')}</ReadingText>
        {articles.items.length ? <EditorialSelect label={t('weekly.chooseArticle')} value={postId} onChange={setPostId} disabled={busy}
          options={[{value:'',label:t('weekly.chooseArticle')},...articles.items.map(article=>({value:article.id,label:article.title}))]} /> : <ReadingText>{t('weekly.noArticles')}</ReadingText>}
        {postId ? <Button label={t('weekly.readArticle')} variant="tertiary" onPress={() => router.push(`/science/post/${postId}`)} /> : null}
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing.space8}}>
          <Button label={t('discover.previous')} variant="secondary" disabled={busy || page===0} onPress={()=>{setPage(value=>value-1);setPostId('');}} />
          <Button label={t('discover.next')} variant="secondary" disabled={busy || (page+1)*articles.size>=articles.total} onPress={()=>{setPage(value=>value+1);setPostId('');}} />
        </View>
        <label htmlFor={dateId} style={{color:colors.primary,fontFamily:'system-ui, sans-serif',fontSize:typography.label.fontSize}}>{t('weekly.featureDate')}</label>
        <input id={dateId} type="datetime-local" value={startsAt} disabled={busy} onChange={event=>setStartsAt(event.target.value)} style={{minHeight:48,padding:spacing.space12,border:`1px solid ${colors.border}`,borderRadius:radii.md,background:colors.surface,color:colors.textPrimary,fontFamily:'system-ui, sans-serif'}} />
        <ReadingText muted>{t('weekly.localTime',{zone})}</ReadingText>
        <ReadingText muted>{t('weekly.replaceHelp')}</ReadingText>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing.space12}}>
          <Button label={t('weekly.featureNow')} loading={busy} disabled={!postId} onPress={()=>select(true)} />
          <Button label={t('weekly.featureSchedule')} variant="secondary" disabled={busy || !postId} onPress={()=>select(false)} />
        </View>
        <Button label={t('weekly.manageArticles')} variant="tertiary" disabled={busy} onPress={()=>router.push('/editorial')} />
      </ReadingCard>
      <ReadingText heading>{t('weekly.featureQueue')}</ReadingText>
      {!features.items.length ? <ReadingText>{t('weekly.noSelection')}</ReadingText> : null}
      {features.items.map(feature=><ReadingCard key={feature.id}>
        <ReadingText heading>{feature.title}</ReadingText>
        <ReadingText muted>{feature.locale.toUpperCase()} · {new Intl.DateTimeFormat(i18n.resolvedLanguage==='pl'?'pl-PL':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(feature.starts_at))} ({zone})</ReadingText>
        {!feature.available ? <ReadingText>{t('weekly.articleUnavailable')}</ReadingText> : null}
        <Button label={t('weekly.removeFeature')} variant="secondary" disabled={busy} onPress={()=>{void run(token=>learningRequest(`/api/v1/editorial/weekly/features/${feature.id}`,{method:'DELETE',token}));}} />
      </ReadingCard>)}
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing.space8}}>
        <Button label={t('discover.previous')} variant="secondary" disabled={busy || featurePage===0} onPress={()=>setFeaturePage(value=>value-1)} />
        <Button label={t('discover.next')} variant="secondary" disabled={busy || (featurePage+1)*features.size>=features.total} onPress={()=>setFeaturePage(value=>value+1)} />
      </View>
      <Button label={t('weekly.legacyTitle')} variant="tertiary" disabled={busy} onPress={()=>setHistory(value=>!value)} />
      {history ? <LegacyArchive /> : null}
    </>}
  </Screen>;
}


function LegacyArchive() {
  const { t } = useTranslation();
  const { getIdToken } = useAuthStatus();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<WeeklyIssue> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(false);
    void (async () => {
      const token = await getIdToken(); if(!token) throw new Error('Session unavailable');
      const value = await learningRequest<Page<WeeklyIssue>>(`/api/v1/editorial/weekly?page=${page}`, {token,signal:controller.signal});
      if(!controller.signal.aborted) setData(value);
    })().catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[page,getIdToken]);
  return <ReadingCard>
    <ReadingText heading>{t('weekly.legacyTitle')}</ReadingText>
    <ReadingText muted>{t('weekly.legacyHelp')}</ReadingText>
    {error ? <Alert variant="danger" message={t('weekly.featureError')} /> : !data ? <LoadingState label={t('discover.loading')} /> : <>
      {data.items.map(item=><ReadingCard key={item.id}>
        <ReadingText heading>{item.title}</ReadingText>
        {item.content_mode==='NEWS' && item.document ? <><RichDocument node={item.document}/><ArticleSources sources={item.sources ?? []}/></> : <>
          {[item.teaser,item.opening_question,item.takeaway,item.established,item.not_established,item.population,item.method].filter(Boolean).map((text,index)=><ReadingText key={index}>{text}</ReadingText>)}
        </>}
      </ReadingCard>)}
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:spacing.space8}}>
        <Button label={t('discover.previous')} variant="secondary" disabled={page===0} onPress={()=>setPage(value=>value-1)}/>
        <Button label={t('discover.next')} variant="secondary" disabled={(page+1)*data.size>=data.total} onPress={()=>setPage(value=>value+1)}/>
      </View>
    </>}
  </ReadingCard>;
}
