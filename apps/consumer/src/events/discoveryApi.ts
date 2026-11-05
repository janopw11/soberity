import { readBackendApiUrl } from '../auth/config';
import type { Page } from '../science/scienceApi';
import type { DiscoveryEvent } from './eventsApi';
import { EventRequestError } from './eventsApi';
import type { LocationPoint } from './locationTypes';

export type LocationRecord = {
  id: string;
  geoname_id: number;
  name: string;
  label: string;
  label_en: string;
  label_pl: string;
  region?: string | null;
  district?: string | null;
};
export type LocationPage = Page<LocationRecord>;
export type NearbyPage = Page<DiscoveryEvent> & { radiusKm: number };
export async function locationsGet(
  path: string,
  signal: AbortSignal,
): Promise<LocationPage> {
  const response = await fetch(
    `${readBackendApiUrl()}/api/v1/locations${path}`,
    { signal, cache: 'no-store' },
  );
  if (!response.ok) throw new EventRequestError(response.status);
  return response.json() as Promise<LocationPage>;
}
/** Coordinates exist only in this request body; never URL, storage, logs or a query cache key. */
export async function nearbyEvents(
  point: LocationPoint,
  signal: AbortSignal,
): Promise<NearbyPage> {
  const response = await fetch(`${readBackendApiUrl()}/api/v1/events/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
    body: JSON.stringify({
      latitude: point.latitude,
      longitude: point.longitude,
      page: 0,
      size: 3,
    }),
  });
  if (!response.ok) throw new EventRequestError(response.status);
  return response.json() as Promise<NearbyPage>;
}
