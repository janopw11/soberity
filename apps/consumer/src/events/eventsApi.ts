import { readBackendApiUrl } from '../auth/config';
import type { Page } from '../science/scienceApi';

export type EventCategory = { code: string; track: string; label_en: string; label_pl: string };
export type DiscoveryEvent = {
  id: string; title: string; locale: 'en' | 'pl'; category_code: string;
  track: 'SOBER_NIGHTLIFE' | 'SOBER_LIFESTYLE';
  alcohol_policy: 'ALCOHOL_FREE' | 'SOBER_FRIENDLY';
  starts_at: string; ends_at: string; timezone: string;
  city: string; region: string | null; country_code: string; venue_name: string;
  organizer_name: string; price_kind: 'FREE' | 'PAID' | 'UNKNOWN';
  price_minor: number | null; currency: string | null;
  accessibility: 'UNKNOWN' | 'ACCESSIBLE' | 'PARTIAL' | 'NOT_ACCESSIBLE';
  availability: 'UNKNOWN' | 'AVAILABLE' | 'SOLD_OUT';
  cover_id: string | null; cover_alt_text: string | null;
};
export type EventPage = Page<DiscoveryEvent>;
export async function eventsGet<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${readBackendApiUrl()}/api/v1/events${path}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Event request failed');
  return response.json() as Promise<T>;
}
export function eventImageUri(id: string): string {
  return `${readBackendApiUrl()}/api/v1/events/media/${encodeURIComponent(id)}`;
}

/** Calendar days in the viewer's timezone; end is exclusive on the server. */
export function dateBoundary(value: string, exclusiveEnd = false): string | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year!, month! - 1, day!); date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month! - 1 || date.getDate() !== day) throw new Error('Invalid date');
  if (exclusiveEnd) date.setDate(date.getDate() + 1);
  return date.toISOString();
}
export const CATEGORY_CODES = ['SOBER_PARTY', 'SOBER_RAVE', 'DANCE', 'LIVE_MUSIC', 'COFFEE_MEETUP', 'SPORT', 'OUTDOORS', 'WORKSHOP', 'CULTURE', 'OTHER'] as const;
