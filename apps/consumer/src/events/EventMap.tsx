import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
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

/**
 * Native map of the Sober Events filters (iOS and Android). Uses Geoapify tiles when the public
 * key is configured, otherwise the platform map. Events without a precise point stay list-only.
 */
export default function EventMap({ query }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useThemePreferences();
  const { height } = useWindowDimensions();
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  const mapRef = useRef<MapView>(null);
  const [result, setResult] = useState<{
    key: string;
    data: EventPage | null;
    error: boolean;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // iOS also reports a marker tap as a map tap; ignore that echo so the selected card stays open.
  const lastMarkerTap = useRef(0);
  const [mapReady, setMapReady] = useState(false);
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
            height: Math.min(520, Math.round(height * 0.6)),
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
              }}
            />
          ))}
        </MapView>
        {apiKey ? (
          <Text style={styles.attribution} accessibilityRole="text">
            {ATTRIBUTION}
          </Text>
        ) : null}
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
});
