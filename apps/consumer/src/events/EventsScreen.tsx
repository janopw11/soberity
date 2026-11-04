import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, Dialog, LoadingState, Screen, TextField } from '../ui';
import { Pagination } from '../ui/Pagination';
import { EventSelect } from './EventSelect';
import { EventCard } from './EventCard';
import { CATEGORY_CODES, dateBoundary, eventsGet, type EventCategory, type EventPage } from './eventsApi';
import { canLocate, locate } from './location';

const initialFilters = {
  city: '', region: '', country: '', category: '', from: '', to: '', priceKind: '', currency: '', maxPrice: '',
  alcoholPolicy: 'ALCOHOL_FREE', accessibility: '', latitude: '', longitude: '', radius: '25', nearby: false,
};

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('START_ASC');
  const [attempt, retry] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [invalid, setInvalid] = useState('');
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);
  const locationRequest = useRef(0);
  useEffect(() => () => { locationRequest.current += 1; }, []);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [result, setResult] = useState<{ key: string; data: EventPage | null; error: boolean } | null>(null);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const requestKey = `${applied}&sort=${sort}&page=${page}&size=12`;
  const data = result?.key === requestKey ? result.data : null;
  const error = result?.key === requestKey && result.error;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    void eventsGet<EventCategory[]>('/categories', controller.signal).then(value => {
      if (!controller.signal.aborted) setCategories(value);
    }).catch(() => { /* Localized taxonomy remains available when category labels cannot load. */ })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    const timeout = setTimeout(() => {
      setResult({ key: requestKey, data: null, error: true }); controller.abort();
    }, 20000);
    void eventsGet<EventPage>(`?${requestKey}`, controller.signal)
      .then(value => { if (!controller.signal.aborted) setResult({ key: requestKey, data: value, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error: true }); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [requestKey, attempt]);

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft(previous => ({ ...previous, [key]: value })); setInvalid('');
  };
  const categoryLabel = (code: string) => {
    const category = categories.find(item => item.code === code);
    return (locale === 'pl' ? category?.label_pl : category?.label_en) ?? t(`events.categories.${code}`);
  };
  const options = (keys: string[], prefix: string) => [{ value: '', label: t('events.any') }, ...keys.map(value => ({ value, label: t(`${prefix}.${value}`) }))];
  const apply = () => {
    try {
      const params = new URLSearchParams();
      for (const key of ['city', 'region', 'category', 'priceKind', 'accessibility', 'alcoholPolicy'] as const) {
        if (draft[key].trim()) params.set(key, draft[key].trim());
      }
      if (draft.country.trim()) {
        if (!/^[a-z]{2}$/i.test(draft.country.trim())) { setInvalid('countryError'); return; }
        params.set('country', draft.country.trim().toUpperCase());
      }
      let from: string | undefined, to: string | undefined;
      try { from = dateBoundary(draft.from); to = dateBoundary(draft.to, true); }
      catch { setInvalid('dateError'); return; }
      if (to && new Date(to).getTime() <= (from ? new Date(from).getTime() : Date.now())) { setInvalid('dateError'); return; }
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const currency = draft.currency.trim().toUpperCase();
      if (currency) {
        if (!/^[A-Z]{3}$/.test(currency)) { setInvalid('priceError'); return; }
        params.set('currency', currency);
      }
      if (draft.maxPrice.trim()) {
        const value = draft.maxPrice.trim().replace(',', '.');
        if (!currency || !/^\d+(\.\d+)?$/.test(value)) { setInvalid('priceError'); return; }
        const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
        if ((value.split('.')[1]?.length ?? 0) > digits) { setInvalid('priceError'); return; }
        const minor = Math.round(Number(value) * 10 ** digits);
        if (!Number.isSafeInteger(minor) || minor < 0) { setInvalid('priceError'); return; }
        params.set('maxPriceMinor', String(minor));
      }
      if (draft.nearby) {
        const latitude = Number(draft.latitude.replace(',', '.')), longitude = Number(draft.longitude.replace(',', '.')), radius = Number(draft.radius.replace(',', '.'));
        if (!draft.latitude.trim() || !draft.longitude.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radius)
          || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || radius < 0.1 || radius > 250) { setInvalid('locationInvalid'); return; }
        params.set('latitude', String(latitude)); params.set('longitude', String(longitude)); params.set('radiusKm', String(radius));
      }
      setInvalid(''); setPage(0); setApplied(params.toString()); setAdvanced(false); retry(value => value + 1);
    } catch { setInvalid('priceError'); }
  };
  const clear = () => {
    locationRequest.current += 1; setLocating(false); setLocationError(false);
    setDraft(initialFilters); setApplied(''); setPage(0); setSort('START_ASC'); setInvalid(''); setAdvanced(false);
    retry(value => value + 1);
  };
  const deviceLocation = async () => {
    const request = ++locationRequest.current;
    setLocating(true); setLocationError(false);
    try {
      const coordinates = await locate();
      if (request === locationRequest.current) setDraft(previous => ({ ...previous, latitude: coordinates.latitude.toFixed(5), longitude: coordinates.longitude.toFixed(5), nearby: true }));
    } catch { if (request === locationRequest.current) setLocationError(true); }
    finally { if (request === locationRequest.current) setLocating(false); }
  };
  const field = (key: 'city' | 'region' | 'country' | 'from' | 'to' | 'currency' | 'maxPrice' | 'latitude' | 'longitude' | 'radius', maxLength = 150) => <TextField compact accentLabel label={t(`events.${key}`)} value={draft[key]}
    onChangeText={value => update(key, value)} maxLength={maxLength} autoCorrect={false} autoCapitalize={key === 'country' || key === 'currency' ? 'characters' : 'none'}
    placeholder={key === 'from' || key === 'to' ? 'YYYY-MM-DD' : ''} />;
  const select = (key: 'category' | 'priceKind' | 'accessibility' | 'alcoholPolicy', choices: { value: string; label: string }[]) => <EventSelect label={t(`events.${key}`)} value={draft[key]} options={choices} onChange={value => update(key, value)} />;

  return <Screen maxWidth={1040} avoidKeyboard>
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.primary }]}>{t('events.discoverTitle')}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{t('events.discoverDescription')}</Text>
    </View>
    <View style={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.field}>{field('city')}</View>
        <View style={styles.field}>{select('category', [{ value: '', label: t('events.any') }, ...CATEGORY_CODES.map(code => ({ value: code, label: categoryLabel(code) }))])}</View>
      </View>
      <View style={styles.row}>
        <View style={styles.field}>{field('from', 10)}</View><View style={styles.field}>{field('to', 10)}</View>
      </View>
      <Text style={[styles.caption, { color: colors.textMuted }]}>{t('events.dateHint', { zone })}</Text>
      {select('alcoholPolicy', ['ALCOHOL_FREE', 'SOBER_FRIENDLY'].map(value => ({ value, label: t(value === 'ALCOHOL_FREE' ? 'events.alcoholFree' : 'events.soberFriendly') })))}
      {draft.alcoholPolicy === 'SOBER_FRIENDLY' ? <Text style={[styles.small, { color: colors.textSecondary }]}>{t('events.friendlyHint')}</Text> : null}
      <View style={styles.actions}>
        <Button label={t('events.moreFilters')} variant="secondary" onPress={() => setAdvanced(true)} />
        <Button label={t('events.apply')} onPress={apply} />
        <Button label={t('events.reset')} variant="tertiary" onPress={clear} />
      </View>
      {invalid && !advanced ? <Alert variant="danger" message={t(`events.${invalid}`)} /> : null}
    </View>
    <Dialog visible={advanced} title={t('events.moreFilters')} closeLabel={t('events.close')} onClose={() => setAdvanced(false)}>
      {field('region')}{field('country', 2)}
      {select('priceKind', options(['FREE', 'PAID', 'UNKNOWN'], 'events.priceKinds'))}
      {field('currency', 3)}{field('maxPrice', 16)}
      <Text style={[styles.small, { color: colors.textSecondary }]}>{t('events.priceHint')}</Text>
      {select('accessibility', options(['ACCESSIBLE', 'PARTIAL', 'NOT_ACCESSIBLE', 'UNKNOWN'], 'events.accessibilityValues'))}
      <Text accessibilityRole="header" style={[styles.subheading, { color: colors.primary }]}>{t('events.nearbyTitle')}</Text>
      <Text style={[styles.small, { color: colors.textSecondary }]}>{t('events.locationHint')}</Text>
      <Button variant="secondary" label={t(draft.nearby ? 'events.disableNearby' : 'events.enableNearby')} onPress={() => {
        locationRequest.current += 1; setLocating(false); setLocationError(false);
        setDraft(previous => ({ ...previous, nearby: !previous.nearby, latitude: '', longitude: '' }));
      }} />
      {draft.nearby ? <>
        {canLocate ? <Button variant="secondary" label={t('events.useLocation')} loading={locating} onPress={() => { void deviceLocation(); }} /> : null}
        {field('latitude', 20)}{field('longitude', 20)}{field('radius', 8)}
        {locationError ? <Alert variant="danger" message={t('events.locationError')} /> : null}
      </> : null}
      {invalid ? <Alert variant="danger" message={t(`events.${invalid}`)} /> : null}
      <Button label={t('events.apply')} onPress={apply} />
    </Dialog>
    <View style={styles.resultsHeader}>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.subheading, { color: colors.textPrimary }]}>{t('events.upcoming')}</Text>
      <View style={styles.sort}><EventSelect label={t('events.sort')} value={sort} options={['START_ASC', 'START_DESC'].map(value => ({ value, label: t(`events.sortValues.${value}`) }))} onChange={value => { setPage(0); setSort(value); }} /></View>
    </View>
    {applied ? <Text style={[styles.caption, { color: colors.textMuted }]}>{t('events.appliedFilters')}</Text> : null}
    {error ? <View style={styles.state}>
      <Alert variant="danger" message={t('events.error')} /><Button variant="secondary" label={t('events.retry')} onPress={() => retry(value => value + 1)} />
    </View> : !data ? <LoadingState label={t('events.loading')} /> : data.items.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.surfaceAlt }]}>
      <Text accessibilityRole="header" style={[styles.subheading, { color: colors.textPrimary }]}>{t('events.emptyTitle')}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{t('events.emptyDescription')}</Text>
      <Button variant="tertiary" label={t(page > 0 ? 'events.firstPage' : 'events.reset')} onPress={page > 0 ? () => setPage(0) : clear} />
    </View> : <>
      <Text accessibilityLiveRegion="polite" style={[styles.small, { color: colors.textSecondary }]}>{t('events.results', { count: data.total })}</Text>
      <View style={styles.grid}>{data.items.map(event => <View key={event.id} style={styles.cardSlot}><EventCard event={event} category={categoryLabel(event.category_code)} /></View>)}</View>
      <Pagination page={data.page} size={data.size} total={data.total} onPageChange={setPage}
        label={t('discover.page', { page: data.page + 1, pages: Math.max(1, Math.ceil(data.total / data.size)), count: data.total })} />
    </>}
  </Screen>;
}
const styles = StyleSheet.create({
  intro: { gap: spacing.space8 }, heading: { ...typography.h2 }, subheading: { ...typography.h3 },
  body: { ...typography.body }, small: { ...typography.small }, caption: { ...typography.caption },
  filters: { padding: spacing.space16, borderWidth: 1, borderRadius: radii.lg, gap: spacing.space12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space12 }, field: { flexGrow: 1, flexBasis: 240, minWidth: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 },
  resultsHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space16, alignItems: 'center', justifyContent: 'space-between' },
  sort: { minWidth: 200, maxWidth: '100%' }, state: { gap: spacing.space12 },
  empty: { padding: spacing.space24, borderRadius: radii.lg, gap: spacing.space12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space16, alignItems: 'flex-start' },
  cardSlot: { flexBasis: 320, flexGrow: 1, maxWidth: '100%', minWidth: 0 },
});
