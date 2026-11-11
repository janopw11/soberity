import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import EventPreviewDialog from './EventPreviewDialog';
import {
  eventsGet,
  eventImageUri,
  type DiscoveryEvent,
  type EventPage,
} from './eventsApi';
import {
  hasPreciseLocation,
  MARKER_SIZE,
  mapEventsQuery,
  mapFitTargets,
  type PreciseCoordinates,
} from './mapModel';
import { useEventLocation } from './EventLocationContext';

type Props = { query: string };
type PreciseEvent = DiscoveryEvent & PreciseCoordinates;

const ATTRIBUTION = '© Geoapify · © OpenMapTiles · © OpenStreetMap';
/** Visible latitude span after a tap: about 1 km, street level. */
const FOCUS_SPAN = 0.01;

/**
 * Native map of the Sober Events filters (iOS and Android). Uses Geoapify tiles when the public
 * key is configured, otherwise the platform map. Events without a precise point stay list-only.
 */
export default function EventMap({ query }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useThemePreferences();
  const { height } = useWindowDimensions();
  const frameHeight = Math.min(520, Math.round(height * 0.6));
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region | null>(null);

  /** Halves (zoom in) or doubles (zoom out) the visible span around the current centre. */
  const zoomBy = (factor: number) => {
    const current = regionRef.current ?? {
      latitude: 20,
      longitude: 0,
      latitudeDelta: 120,
      longitudeDelta: 120,
    };
    const latitudeDelta = Math.min(
      170,
      Math.max(0.002, current.latitudeDelta * factor),
    );
    const longitudeDelta = Math.min(
      170,
      Math.max(0.002, current.longitudeDelta * factor),
    );
    mapRef.current?.animateToRegion(
      { ...current, latitudeDelta, longitudeDelta },
      250,
    );
  };
  const [result, setResult] = useState<{
    key: string;
    data: EventPage | null;
    error: boolean;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // iOS also reports a marker tap as a map tap; ignore that echo so the selected card stays open.
  const lastMarkerTap = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  // The overview fit runs once per result set, so it cannot override a marker focus.
  const fittedFor = useRef<PreciseEvent[] | null>(null);
  const requestKey = mapEventsQuery(query);

  useEffect(() => {
    const controller = new AbortController();
    eventsGet<EventPage>(requestKey, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, data: null, error: true });
      });
    return () => controller.abort();
  }, [requestKey]);

  const data = result?.key === requestKey ? result.data : null;
  const failed = result?.key === requestKey && result.error;
  const points = useMemo(
    () => (data?.items ?? []).filter(hasPreciseLocation) as PreciseEvent[],
    [data],
  );
  const selected = points.find((event) => event.id === selectedId) ?? null;
  const { enabled, currentLocation } = useEventLocation();
  const originLatitude = enabled ? (currentLocation?.latitude ?? null) : null;
  const originLongitude = enabled ? (currentLocation?.longitude ?? null) : null;
  const origin = useMemo(
    () =>
      originLatitude !== null && originLongitude !== null
        ? { latitude: originLatitude, longitude: originLongitude }
        : null,
    [originLatitude, originLongitude],
  );
  const fitTargets = useMemo(
    () => mapFitTargets(points, origin),
    [points, origin],
  );

  useEffect(() => {
    if (!mapReady || fitTargets.length === 0) return;
    if (fittedFor.current === points) return;
    fittedFor.current = points;
    mapRef.current?.fitToCoordinates(
      fitTargets.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
      {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: true,
      },
    );
  }, [fitTargets, mapReady]);

  if (failed)
    return (
      <Text style={[styles.notice, { color: colors.textMuted }]}>
        {t('events.map.error')}
      </Text>
    );
  if (!data)
    return (
      <Text style={[styles.notice, { color: colors.textMuted }]}>
        {t('events.loading')}
      </Text>
    );
  if (points.length === 0)
    return (
      <Text style={[styles.notice, { color: colors.textMuted }]}>
        {data.total > 0
          ? t('events.map.cityOnly', { count: data.total })
          : t('events.map.empty')}
      </Text>
    );

  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  return (
    <View style={styles.wrap}>
      {data.total > data.items.length ? (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          {t('events.map.truncated', {
            shown: data.items.length,
            total: data.total,
          })}
        </Text>
      ) : null}
      <View
        accessibilityLabel={t('events.map.label')}
        style={[
          styles.frame,
          {
            height: frameHeight,
            borderColor: colors.border,
          },
        ]}
      >
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: 20,
            longitude: 0,
            latitudeDelta: 120,
            longitudeDelta: 120,
          }}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={(region) => {
            regionRef.current = region;
          }}
          onPress={() => {
            if (Date.now() - lastMarkerTap.current < 400) return;
            setSelectedId(null);
          }}
          toolbarEnabled={false}
        >
          {apiKey ? (
            <UrlTile
              urlTemplate={`https://maps.geoapify.com/v1/tile/${theme === 'dark' ? 'dark-matter' : 'positron'}/{z}/{x}/{y}.png?apiKey=${apiKey}`}
              maximumZ={19}
              tileSize={256}
            />
          ) : null}
          {origin ? (
            <Marker
              coordinate={{
                latitude: origin.latitude,
                longitude: origin.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.userDot,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              />
            </Marker>
          ) : null}
          {points.map((event) => (
            <EventMarker
              key={event.id}
              event={event}
              initial={t(`events.categories.${event.category_code}`)
                .charAt(0)
                .toUpperCase()}
              onPress={() => {
                lastMarkerTap.current = Date.now();
                setSelectedId(event.id);
                // Centre the map exactly on the event's coordinates at a fixed street-level span.
                mapRef.current?.animateToRegion(
                  {
                    latitude: event.latitude,
                    longitude: event.longitude,
                    latitudeDelta: FOCUS_SPAN,
                    longitudeDelta: FOCUS_SPAN,
                  },
                  350,
                );
              }}
            />
          ))}
        </MapView>
        {apiKey ? (
          <Text style={styles.attribution} accessibilityRole="text">
            {ATTRIBUTION}
          </Text>
        ) : null}
        <View style={styles.zoomColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('events.map.zoomIn')}
            onPress={() => zoomBy(0.5)}
            style={[
              styles.zoomButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.zoomLabel, { color: colors.primary }]}>+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('events.map.zoomOut')}
            onPress={() => zoomBy(2)}
            style={[
              styles.zoomButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.zoomLabel, { color: colors.primary }]}>−</Text>
          </Pressable>
        </View>
        {selected ? (
          <EventPreviewDialog
            event={selected}
            locale={locale}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * One marker per event: the event photo in a circle, or the category initial on the theme colour.
 * Native markers need tracksViewChanges until their content is drawn, then freeze for performance.
 */
function EventMarker({
  event,
  initial,
  onPress,
}: {
  event: PreciseEvent;
  initial: string;
  onPress: () => void;
}) {
  const { colors } = useThemePreferences();
  const [tracks, setTracks] = useState(true);
  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
      onPress={onPress}
      accessibilityLabel={event.title}
    >
      <View
        style={[
          styles.markerRing,
          { backgroundColor: colors.primary, borderColor: colors.surface },
        ]}
      >
        {event.cover_id ? (
          <Image
            source={{ uri: eventImageUri(event.cover_id) }}
            style={styles.markerImage}
            onLoadEnd={() => setTracks(false)}
          />
        ) : (
          <Text
            onLayout={() => setTracks(false)}
            style={[styles.markerInitial, { color: colors.onPrimary }]}
          >
            {initial}
          </Text>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  notice: { fontSize: 14, lineHeight: 20 },
  frame: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attribution: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    fontSize: 10,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  markerRing: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: { width: '100%', height: '100%' },
  markerInitial: { fontSize: 16, fontWeight: '600' },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  zoomColumn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 6,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
});
