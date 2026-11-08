import type { DiscoveryEvent } from './eventsApi';

/** Maximum page size the public events API accepts. */
export const MAP_PAGE_SIZE = 100;

type LocationFields = Pick<
  DiscoveryEvent,
  'coordinate_source' | 'latitude' | 'longitude'
>;
export type PreciseCoordinates = { latitude: number; longitude: number };

/** A marker is shown only for a stored precise point; city-centroid events stay list-only. */
export function hasPreciseLocation<T extends LocationFields>(
  event: T,
): event is T & PreciseCoordinates {
  return (
    event.coordinate_source === 'VENUE' &&
    typeof event.latitude === 'number' &&
    typeof event.longitude === 'number' &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude)
  );
}

/** Same filters as the list view, requested once for the map with the maximum page size. */
export function mapEventsQuery(appliedQuery: string): string {
  const base = appliedQuery ? `${appliedQuery}&` : '';
  return `?${base}page=0&size=${MAP_PAGE_SIZE}`;
}

/** How many of the nearest events the map frames around the user's approximate position. */
export const NEAREST_EVENTS_FOR_MAP = 12;

const EARTH_RADIUS_KM = 6371.0088;

export function distanceKm(
  a: PreciseCoordinates,
  b: PreciseCoordinates,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Coordinates the map should frame. With a consented position, the user's point plus the nearest
 * events are used so the view is local rather than world-wide; without one, every event is framed.
 */
export function mapFitTargets(
  points: PreciseCoordinates[],
  origin: PreciseCoordinates | null,
): PreciseCoordinates[] {
  if (!origin) return points;
  const nearest = [...points]
    .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
    .slice(0, NEAREST_EVENTS_FOR_MAP);
  return [origin, ...nearest];
}

export const MARKER_SIZE = 44;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Marker HTML: the event photo inside a circle, or the category initial on the theme colour when
 * the event has no cover yet. Category artwork can replace the initial later without touching callers.
 */
export function eventMarkerHtml(
  event: {
    id: string;
    cover_id: string | null;
    cover_alt_text: string | null;
    title: string;
  },
  categoryLabel: string,
  palette: { primary: string; onPrimary: string; surface: string },
  imageUrl: (id: string) => string,
): string {
  const ring = `width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;overflow:hidden;border:3px solid ${palette.surface};box-shadow:0 1px 4px rgba(0,0,0,.35);box-sizing:border-box;display:flex;align-items:center;justify-content:center`;
  if (event.cover_id) {
    const alt = escapeHtml(event.cover_alt_text?.trim() || event.title);
    return `<div style="${ring}"><img src="${escapeHtml(imageUrl(event.cover_id))}" alt="${alt}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
  }
  const initial = escapeHtml(
    categoryLabel.trim().charAt(0).toUpperCase() || '•',
  );
  return `<div style="${ring};background:${palette.primary};color:${palette.onPrimary};font:600 16px system-ui,sans-serif" aria-hidden="true">${initial}</div>`;
}

export function directionUrls(point: PreciseCoordinates & { title: string }) {
  const coordinates = `${point.latitude},${point.longitude}`;
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${coordinates}`,
    apple: `https://maps.apple.com/?ll=${coordinates}&q=${encodeURIComponent(point.title)}`,
  };
}
