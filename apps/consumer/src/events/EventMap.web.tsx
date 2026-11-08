import 'leaflet/dist/leaflet.css';
import { divIcon, latLngBounds } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { useEventLocation } from './EventLocationContext';
import {
  eventMarkerHtml,
  hasPreciseLocation,
  mapEventsQuery,
  mapFitTargets,
  MARKER_SIZE,
} from './mapModel';
import { EventPreviewDialog } from './EventPreviewDialog.web';
import { eventImageUri, eventsGet, type EventPage } from './eventsApi';

type Props = { query: string };

const ATTRIBUTION =
  '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Map view of the Sober Events filters. Lazy-loaded; list-only events without a precise point are skipped. */
export default function EventMap({ query }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useThemePreferences();
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  const [result, setResult] = useState<{
    key: string;
    data: EventPage | null;
    error: boolean;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    () => (data?.items ?? []).filter(hasPreciseLocation),
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
  const palette = useMemo(
    () => ({
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      surface: colors.surface,
    }),
    [colors.primary, colors.onPrimary, colors.surface],
  );
  const markerIcons = useMemo(
    () =>
      new Map(
        points.map((event) => [
          event.id,
          divIcon({
            className: 'ev-marker-icon',
            html: eventMarkerHtml(
              event,
              t(`events.categories.${event.category_code}`),
              palette,
              eventImageUri,
            ),
            iconSize: [MARKER_SIZE, MARKER_SIZE],
            iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
          }),
        ]),
      ),
    [points, palette, t],
  );

  if (!apiKey) return <p role="status">{t('events.map.unavailable')}</p>;
  if (failed) return <p role="alert">{t('events.map.error')}</p>;
  if (!data) return <p role="status">{t('events.loading')}</p>;
  if (points.length === 0)
    return (
      <p role="status">
        {data.total > 0
          ? t('events.map.cityOnly', { count: data.total })
          : t('events.map.empty')}
      </p>
    );

  return (
    <section
      aria-label={t('events.map.label')}
      style={{ display: 'grid', gap: 12 }}
    >
      {data.total > data.items.length ? (
        <p
          role="note"
          style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}
        >
          {t('events.map.truncated', {
            shown: data.items.length,
            total: data.total,
          })}
        </p>
      ) : null}
      <div
        style={{
          position: 'relative',
          height: 420,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
        }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url={`https://maps.geoapify.com/v1/tile/${theme === 'dark' ? 'dark-matter' : 'positron'}/{z}/{x}/{y}.png?apiKey=${apiKey}`}
            attribution={ATTRIBUTION}
          />
          <FitToEvents targets={fitTargets} />
          {origin ? (
            <CircleMarker
              center={[origin.latitude, origin.longitude]}
              radius={7}
              pathOptions={{
                color: colors.surface,
                weight: 2,
                fillColor: colors.primary,
                fillOpacity: 1,
              }}
            />
          ) : null}
          {points.map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={markerIcons.get(event.id)}
              title={event.title}
              eventHandlers={{ click: () => setSelectedId(event.id) }}
            />
          ))}
        </MapContainer>
        {selected ? (
          <EventPreviewDialog
            event={selected}
            locale={i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </section>
  );
}

function FitToEvents({
  targets,
}: {
  targets: Array<{ latitude: number; longitude: number }>;
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = latLngBounds(
      targets.map(
        (point) => [point.latitude, point.longitude] as [number, number],
      ),
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, targets]);
  return null;
}
