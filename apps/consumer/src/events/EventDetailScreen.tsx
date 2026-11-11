import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useRouter,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { Alert, Button, Dialog, LoadingState, Screen } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { ReadingText, RichDocument } from '../science/readingUi';
import { hasPreciseLocation } from './mapModel';
import { EventGoingButton } from './EventGoingButton';
const DirectionsChooser = lazy(() => import('./DirectionsChooser'));
/* eslint-disable @typescript-eslint/no-require-imports -- Metro static assets */
const mapIconLight = require('../../assets/images/map-icon-light.png');
const mapIconDark = require('../../assets/images/map-icon-dark.png');
/* eslint-enable @typescript-eslint/no-require-imports */
import {
  EventActionBar,
  EventBackButton,
  EventHero,
  EventInfoRow,
  EventOrganizer,
  EventSection,
} from './EventDetailParts';
import {
  detailAction,
  detailDates,
  detailLocation,
  detailPrice,
  eventIsActive,
  isPreviewListing,
  type DetailAction,
} from './eventDetailPresentation';
import { EventMetadata } from './EventMetadata';
import {
  EventRequestError,
  eventsGet,
  organizerGet,
  validEventId,
  type EventDetail,
  type PublicOrganizer,
} from './eventsApi';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  // Arrays, arbitrary redirect params and malformed paths never reach the API.
  return (
    <Detail
      key={typeof id === 'string' ? id : 'invalid'}
      id={validEventId(id) ? id : null}
    />
  );
}
function Detail({ id }: { id: string | null }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/events');
  };
  const { colors, theme } = useThemePreferences();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [organizer, setOrganizer] = useState<PublicOrganizer | null>(null);
  const [organizerFailed, setOrganizerFailed] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [error, setError] = useState<'unavailable' | 'error' | null>(null);
  const [attempt, retry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [confirmedAction, setConfirmedAction] = useState<DetailAction | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());
  const action = useRef<AbortController | null>(null);
  useEffect(() => () => action.current?.abort(), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  useEffect(() => {
    setEvent(null);
    setOrganizer(null);
    setError(null);
    setConfirmedAction(null);
    setActionError(false);
    action.current?.abort();
    setBusy(false);
    if (!id) {
      setError('unavailable');
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setError('error');
      controller.abort();
    }, 20000);
    void eventsGet<EventDetail>(`/${id}`, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setEvent(value);
          setNow(Date.now());
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof EventRequestError && reason.status === 404
              ? 'unavailable'
              : 'error',
          );
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [id, attempt]);
  useEffect(() => {
    setOrganizer(null);
    setOrganizerFailed(false);
    if (!event?.organizer_id) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setOrganizerFailed(true);
      controller.abort();
    }, 20000);
    void organizerGet(event.organizer_id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setOrganizer(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOrganizerFailed(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [event]);
  const language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
  const nextAction = event ? detailAction(event, organizer, now) : null;
  const organizerLoading = Boolean(
    event?.organizer_id && !organizer && !organizerFailed,
  );
  const openExternal = async () => {
    if (!id || busy || !confirmedAction) return;
    const expected = confirmedAction;
    const controller = new AbortController();
    action.current?.abort();
    action.current = controller;
    setBusy(true);
    setActionError(false);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const current = await eventsGet<EventDetail>(`/${id}`, controller.signal);
      if (controller.signal.aborted) return;
      const host =
        current.organizer_id && current.organizer_url == null
          ? await organizerGet(current.organizer_id, controller.signal)
          : null;
      const destination = detailAction(current, host, Date.now());
      if (
        !destination ||
        destination.kind !== expected.kind ||
        destination.url !== expected.url
      ) {
        setEvent(current);
        if (host) setOrganizer(host);
        setConfirmedAction(null);
        throw new Error('Event action changed or unavailable');
      }
      if (controller.signal.aborted) return;
      await Linking.openURL(destination.url);
      setConfirmedAction(null);
    } catch {
      if (action.current === controller) setActionError(true);
    } finally {
      clearTimeout(timeout);
      if (action.current === controller) setBusy(false);
    }
  };
  if (error || !event)
    return (
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <View style={styles.stateHeader}>
          <EventBackButton onPress={goBack} />
        </View>
        <Screen maxWidth={800}>
          <EventMetadata
            title={t('events.detailTitle')}
            description={error ? t('events.detail.unavailable') : ''}
          />
          {error ? (
            <>
              <Alert variant="danger" message={t(`events.detail.${error}`)} />
              {error === 'error' ? (
                <Button
                  label={t('events.retry')}
                  variant="secondary"
                  onPress={() => retry((value) => value + 1)}
                />
              ) : null}
              <Link
                href="/events"
                style={{
                  ...typography.bodyStrong,
                  color: colors.primary,
                  padding: spacing.space12,
                }}
              >
                {t('events.detail.browse')}
              </Link>
            </>
          ) : (
            <LoadingState label={t('events.detail.loading')} />
          )}
        </Screen>
      </SafeAreaView>
    );
  const dates = detailDates(event, locale);
  const place = detailLocation(event, language);
  const mapEvent = hasPreciseLocation(event) ? event : null;
  const price = detailPrice(event, locale);
  const preview = isPreviewListing(event);
  const hostName = organizer?.name?.trim() || event.organizer_name?.trim();
  const availability =
    event.availability === 'AVAILABLE' || event.availability === 'SOLD_OUT'
      ? t(`events.availability.${event.availability}`)
      : undefined;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <EventMetadata title={event.title} description={event.description} />
      <ScrollView
        testID="event-detail-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <EventHero
          coverId={event.cover_id}
          alt={event.cover_alt_text?.trim() || event.title}
          onBack={goBack}
        />
        <View
          style={[
            styles.body,
            {
              backgroundColor: colors.background,
              paddingHorizontal:
                width >= 768 ? spacing.space40 : spacing.space24,
            },
          ]}
        >
          <View style={styles.identity}>
            <View style={styles.titleRow}>
              <Text
                selectable
                accessibilityRole="header"
                style={[
                  styles.titleText,
                  width >= 768 ? typography.display : typography.h1,
                  { color: colors.textPrimary },
                ]}
              >
                {event.title?.trim() || t('events.detailTitle')}
              </Text>
              {mapEvent ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('events.map.showOnMap')}
                    onPress={() => setDirectionsOpen(true)}
                    style={({ pressed }) => [
                      styles.mapButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: pressed
                          ? colors.surfaceAlt
                          : colors.surface,
                      },
                    ]}
                  >
                    <Image
                      source={theme === 'dark' ? mapIconDark : mapIconLight}
                      style={styles.mapIcon}
                      accessibilityIgnoresInvertColors
                    />
                  </Pressable>
                  {directionsOpen ? (
                    <Suspense fallback={null}>
                      <DirectionsChooser
                        title={mapEvent.title}
                        latitude={mapEvent.latitude}
                        longitude={mapEvent.longitude}
                        onClose={() => setDirectionsOpen(false)}
                      />
                    </Suspense>
                  ) : null}
                </>
              ) : null}
            </View>
            {event.status === 'CANCELLED' ? (
              <Alert variant="warning" message={t('events.detail.cancelled')} />
            ) : !eventIsActive(event, now) && !preview ? (
              <Alert variant="info" message={t('events.detail.ended')} />
            ) : null}
          </View>
          {dates || place || price || availability ? (
            <View style={[styles.facts, { borderColor: colors.surfaceAlt }]}>
              {dates ? (
                <View
                  style={[
                    styles.fact,
                    { flexBasis: width >= 768 ? '40%' : '100%' },
                  ]}
                >
                  <EventInfoRow
                    icon="calendar"
                    value={dates.day}
                    detail={dates.time}
                  />
                </View>
              ) : null}
              {place ? (
                <View
                  style={[
                    styles.fact,
                    { flexBasis: width >= 768 ? '40%' : '100%' },
                  ]}
                >
                  {mapEvent ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('events.map.openDirections')}
                      onPress={() => setDirectionsOpen(true)}
                      style={({ pressed }) =>
                        pressed ? { opacity: 0.7 } : undefined
                      }
                    >
                      <EventInfoRow
                        icon="location"
                        value={place.name}
                        detail={place.detail}
                      />
                    </Pressable>
                  ) : (
                    <EventInfoRow
                      icon="location"
                      value={place.name}
                      detail={place.detail}
                    />
                  )}
                </View>
              ) : null}
              {price || availability ? (
                <View
                  style={[
                    styles.fact,
                    { flexBasis: width >= 768 ? '40%' : '100%' },
                  ]}
                >
                  <EventInfoRow
                    icon="arrowUpRight"
                    label={t('events.detail.admission')}
                    value={
                      price === 'FREE'
                        ? t('events.free')
                        : (price ?? availability!)
                    }
                    detail={price ? availability : undefined}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
          <EventSection title={t('events.detail.about')}>
            {event.locale !== language ? (
              <ReadingText muted>
                {t(`events.contentLanguage.${event.locale}`)}
              </ReadingText>
            ) : null}
            {event.description_document ? (
              <RichDocument node={event.description_document} />
            ) : (
              <ReadingText>
                {event.description?.trim() ||
                  t('events.detail.descriptionEmpty')}
              </ReadingText>
            )}
          </EventSection>
          {hostName ? (
            <EventOrganizer
              name={hostName}
              description={organizer?.description?.trim()}
              verified={organizer?.verification === 'VERIFIED'}
            />
          ) : null}
          {actionError ? (
            <Alert variant="danger" message={t('events.detail.actionError')} />
          ) : null}
        </View>
        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: colors.surface }}
        >
          <EventActionBar
            variant={nextAction?.kind === 'tickets' ? 'secondary' : 'primary'}
            label={
              nextAction
                ? t(
                    nextAction.kind === 'tickets'
                      ? 'events.detail.getTickets'
                      : 'events.detail.viewOrganizer',
                  )
                : undefined
            }
            busy={busy}
            notice={
              organizerLoading ? t('events.detail.organizerLoading') : undefined
            }
            onPress={() => {
              setActionError(false);
              setConfirmedAction(nextAction);
            }}
          />
          {event ? (
            <View style={styles.goingBar}>
              <EventGoingButton eventId={event.id} />
            </View>
          ) : null}
        </SafeAreaView>
      </ScrollView>
      <Dialog
        visible={Boolean(confirmedAction)}
        title={t('events.detail.externalTitle')}
        closeLabel={t('events.close')}
        onClose={() => {
          const pending = action.current;
          action.current = null;
          pending?.abort();
          setBusy(false);
          setConfirmedAction(null);
        }}
      >
        <ReadingText>
          {t('events.detail.externalHost', {
            host: confirmedAction ? new URL(confirmedAction.url).hostname : '',
          })}
        </ReadingText>
        <ReadingText muted>{t('events.detail.externalNotice')}</ReadingText>
        {actionError ? (
          <Alert variant="danger" message={t('events.detail.actionError')} />
        ) : null}
        <Button
          label={t('events.detail.continue')}
          loading={busy}
          onPress={() => {
            void openExternal();
          }}
        />
      </Dialog>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: spacing.space12,
  },
  titleText: { flexShrink: 1, flexGrow: 1 },
  mapButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
  },
  mapIcon: { width: 24, height: 24 },
  goingBar: {
    paddingHorizontal: spacing.space16,
    paddingBottom: spacing.space12,
  },
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    flexGrow: 1,
  },
  stateHeader: { padding: spacing.space16 },
  body: {
    width: '100%',
    maxWidth: 992,
    alignSelf: 'center',
    paddingTop: spacing.space24,
    paddingBottom: spacing.space40,
    gap: spacing.space32,
    marginTop: -spacing.space24,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  identity: { gap: spacing.space16 },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.space24,
    paddingVertical: spacing.space8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fact: { flexGrow: 1, minWidth: 0 },
});
