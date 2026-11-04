import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, Dialog, LoadingState, Screen, SettingsIcon } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { ReadingCard, ReadingText, RichDocument } from '../science/readingUi';
import { downloadCalendar } from './calendarDownload';
import { EventMetadata } from './EventMetadata';
import { EventRequestError, eventImageUri, eventsGet, organizerGet, safeEventLink, validEventId, type EventDetail, type PublicOrganizer } from './eventsApi';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  // Arrays, arbitrary redirect params and malformed paths never reach the API.
  return <Detail key={typeof id === 'string' ? id : 'invalid'} id={validEventId(id) ? id : null} />;
}
function Detail({ id }: { id: string | null }) {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [organizer, setOrganizer] = useState<PublicOrganizer | null>(null);
  const [organizerFailed, setOrganizerFailed] = useState(false);
  const [error, setError] = useState<'unavailable' | 'error' | null>(null);
  const [attempt, retry] = useState(0);
  const [failedImage, setFailedImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [target, setTarget] = useState<'tickets' | 'organizer' | null>(null);
  const [now, setNow] = useState(Date.now());
  const action = useRef<AbortController | null>(null);
  useEffect(() => () => action.current?.abort(), []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useFocusEffect(useCallback(() => { retry(value => value + 1); }, []));
  useEffect(() => {
    setEvent(null);setOrganizer(null);setError(null);setTarget(null);setFailedImage(false);setActionError(false);
    action.current?.abort();setBusy(false);
    if (!id) {setError('unavailable');return;}
    const controller = new AbortController();
    const timeout = setTimeout(() => {setError('error');controller.abort();}, 20000);
    void eventsGet<EventDetail>(`/${id}`, controller.signal).then(value => {
      if (!controller.signal.aborted) {setEvent(value);setNow(Date.now());}
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof EventRequestError && reason.status === 404 ? 'unavailable' : 'error');
    }).finally(() => clearTimeout(timeout));
    return () => {clearTimeout(timeout);controller.abort();};
  }, [id, attempt]);
  useEffect(() => {
    setOrganizer(null);setOrganizerFailed(false);
    if (!event) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {setOrganizerFailed(true);controller.abort();}, 20000);
    void organizerGet(event.organizer_id, controller.signal).then(value => {if (!controller.signal.aborted) setOrganizer(value);})
      .catch(() => {if (!controller.signal.aborted) setOrganizerFailed(true);}).finally(() => clearTimeout(timeout));
    return () => {clearTimeout(timeout);controller.abort();};
  }, [event]);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB';
  const date = (instant: string, zone: string) => {
    try {return new Intl.DateTimeFormat(locale, {dateStyle: 'full', timeStyle: 'short', timeZone: zone}).format(new Date(instant));}
    catch {return instant;}
  };
  const active = Boolean(event && event.status === 'PUBLISHED' && new Date(event.ends_at).getTime() > now);
  const ticketUrl = safeEventLink(event?.external_ticket_url);
  const organizerUrl = safeEventLink(event?.organizer_url ?? organizer?.website);
  const destination = target === 'tickets' ? ticketUrl : target === 'organizer' ? organizerUrl : null;
  const perform = async (kind: 'calendar' | 'tickets' | 'organizer') => {
    if (!id || busy) return;
    const controller = new AbortController();action.current?.abort();action.current = controller;
    setBusy(true);setActionError(false);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const current = await eventsGet<EventDetail>(`/${id}`, controller.signal);
      if (controller.signal.aborted) return;
      const currentActive = current.status === 'PUBLISHED' && new Date(current.ends_at).getTime() > Date.now();
      if (kind !== 'organizer' && !currentActive) {setEvent(current);setTarget(null);throw new Error('Event inactive');}
      if (kind === 'calendar') await downloadCalendar(id);
      else {
        let url: string | null;
        if (kind === 'tickets') {
          url = safeEventLink(current.external_ticket_url);
          if (current.availability === 'SOLD_OUT' || url !== ticketUrl) {setEvent(current);setTarget(null);throw new Error('Ticket link changed');}
        } else {
          const host = await organizerGet(current.organizer_id, controller.signal);url = safeEventLink(current.organizer_url ?? host.website);
          if (url !== organizerUrl) {setOrganizer(host);setTarget(null);throw new Error('Organizer link changed');}
        }
        if (!url || controller.signal.aborted) throw new Error('Invalid link');
        await Linking.openURL(url);setTarget(null);
      }
    } catch {if (action.current === controller) setActionError(true);}
    finally {clearTimeout(timeout);if (action.current === controller) setBusy(false);}
  };
  if (error) return <Screen maxWidth={800}>
    <EventMetadata title={t('events.detailTitle')} description={t('events.detail.unavailable')} />
    <Alert variant="danger" message={t(`events.detail.${error}`)} />
    {error === 'error' ? <Button label={t('events.retry')} variant="secondary" onPress={() => retry(value => value + 1)} /> : null}
    <Link href="/events" style={{...typography.bodyStrong, color: colors.primary, padding: spacing.space12}}>{t('events.detail.browse')}</Link>
  </Screen>;
  if (!event) return <Screen><EventMetadata title={t('events.detailTitle')} description="" /><LoadingState label={t('events.detail.loading')} /></Screen>;
  let price = t('events.priceUnknown');
  if (event.price_kind === 'FREE') price = t('events.free');
  else if (event.currency && event.price_minor !== null) {
    const format = new Intl.NumberFormat(locale, {style: 'currency', currency: event.currency});
    price = format.format(event.price_minor / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
  }
  return <Screen maxWidth={800}>
    <Stack.Screen options={{ title: event.title }} />
    <EventMetadata title={event.title} description={event.description} />
    {event.status === 'CANCELLED' ? <Alert variant="warning" message={t('events.detail.cancelled')} /> : !active ? <Alert variant="info" message={t('events.detail.ended')} /> : null}
    <View style={[styles.hero, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
      {event.cover_id && !failedImage ? <Image source={{uri: eventImageUri(event.cover_id)}} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={event.cover_alt_text ?? event.title} onError={() => setFailedImage(true)} />
        : <View accessible={false}><SettingsIcon name="calendar" size={48} color={colors.primary} /></View>}
    </View>
    <View style={styles.summary}>
      <Text style={[styles.badge, {color: colors.primary}]}>{t(`events.categories.${event.category_code}`)} · {t(event.alcohol_policy === 'ALCOHOL_FREE' ? 'events.alcoholFree' : 'events.soberFriendly')}</Text>
      <Text selectable accessibilityRole="header" style={[styles.title, {color: colors.textPrimary}]}>{event.title}</Text>
      {event.locale !== (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en') ? <ReadingText muted>{t(`events.contentLanguage.${event.locale}`)}</ReadingText> : null}
      <ReadingText>{date(event.starts_at, event.timezone)} — {date(event.ends_at, event.timezone)}</ReadingText>
      <ReadingText muted>{t('events.detail.eventZone', {zone: event.timezone})}</ReadingText>
      <Text style={[styles.price, {color: colors.primary}]}>{price}</Text>
      {event.availability !== 'UNKNOWN' ? <ReadingText muted>{t(`events.availability.${event.availability}`)}</ReadingText> : null}
    </View>
    <Section title={t('events.detail.about')}><>{event.description_document ? <RichDocument node={event.description_document} /> : <ReadingText>{event.description}</ReadingText>}</></Section>
    <Section title={t('events.detail.soberRules')}>
      {event.alcohol_policy === 'SOBER_FRIENDLY' ? <ReadingText muted>{t('events.friendlyHint')}</ReadingText> : null}
      <ReadingText>{event.alcohol_rules}</ReadingText><ReadingText muted>{event.beverage_notes}</ReadingText>
    </Section>
    <Section title={t('events.detail.place')}>
      <ReadingText>{event.venue_name}</ReadingText><ReadingText muted>{[event.address, event.city, event.region, event.country_code].filter(Boolean).join(', ')}</ReadingText>
      <ReadingText>{t(`events.accessibilityValues.${event.accessibility}`)}</ReadingText>
      {event.accessibility_notes ? <ReadingText muted>{event.accessibility_notes}</ReadingText> : null}
      <ReadingText heading>{t('events.detail.entry')}</ReadingText><ReadingText>{event.entry_rules}</ReadingText>
    </Section>
    <Section title={t('events.detail.organizer')}>
      <ReadingText>{organizer?.name ?? event.organizer_name}</ReadingText>
      {organizer ? <><ReadingText muted>{t('events.detail.verifiedOrganizer')}</ReadingText><ReadingText>{organizer.description}</ReadingText>
        {organizerUrl ? <Button variant="secondary" label={t('events.detail.organizerWebsite')} onPress={() => {setActionError(false);setTarget('organizer');}} /> : <ReadingText muted>{t('events.detail.invalidLink')}</ReadingText>}</>
        : organizerFailed ? <><ReadingText muted>{t('events.detail.organizerError')}</ReadingText><Button variant="tertiary" label={t('events.retry')} onPress={() => retry(value => value + 1)} /></> : <LoadingState label={t('events.detail.organizerLoading')} />}
    </Section>
    {active ? <ReadingCard>
      {ticketUrl && event.availability !== 'SOLD_OUT' ? <><Button label={t('events.detail.tickets')} disabled={busy} onPress={() => {setActionError(false);setTarget('tickets');}} /><ReadingText muted>{t('events.detail.externalCheckout')}</ReadingText></>
        : <ReadingText muted>{t(event.availability === 'SOLD_OUT' ? 'events.availability.SOLD_OUT' : event.external_ticket_url ? 'events.detail.invalidLink' : 'events.detail.noTickets')}</ReadingText>}
      <Button variant="secondary" label={t('events.detail.calendar')} loading={busy && !target} disabled={busy} onPress={() => {void perform('calendar');}} />
      <ReadingText muted>{t('events.detail.calendarHint')}</ReadingText>
    </ReadingCard> : null}
    {actionError ? <Alert variant="danger" message={t('events.detail.actionError')} /> : null}
    <Dialog visible={Boolean(target && destination)} title={t('events.detail.externalTitle')} closeLabel={t('events.close')} onClose={() => {action.current?.abort();setBusy(false);setTarget(null);}}>
      <ReadingText>{t('events.detail.externalHost', {host: destination ? new URL(destination).hostname : ''})}</ReadingText>
      {actionError ? <Alert variant="danger" message={t('events.detail.actionError')} /> : null}
      <Button label={t('events.detail.continue')} loading={busy} onPress={() => {if (target) void perform(target);}} />
    </Dialog>
  </Screen>;
}
function Section({title, children}: PropsWithChildren<{title: string}>) {
  return <ReadingCard><ReadingText heading>{title}</ReadingText>{children}</ReadingCard>;
}
const styles = StyleSheet.create({
  hero: {width: '100%', aspectRatio: 16 / 8, borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  summary: {gap: spacing.space8}, title: {...typography.h2}, price: {...typography.h3}, badge: {...typography.label},
});
