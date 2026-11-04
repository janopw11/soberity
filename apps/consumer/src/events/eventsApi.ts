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
export class EventRequestError extends Error {
  constructor(readonly status: number) { super('Event request failed'); }
}
export async function eventsGet<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${readBackendApiUrl()}/api/v1/events${path}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new EventRequestError(response.status);
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

export type EventDetail = DiscoveryEvent & {
  description_document?: import('../science/scienceApi').DocumentNode | null; organizer_url?: string | null;
  status: 'PUBLISHED' | 'CANCELLED'; description: string; alcohol_rules: string; beverage_notes: string;
  entry_rules: string; accessibility_notes: string | null; address: string;
  organizer_id: string; external_ticket_url: string | null;
};
export type PublicOrganizer = { id: string; name: string; description: string; website: string; verification: 'VERIFIED' };
export const validEventId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
/** Only HTTP requests to the configured API; callers cannot supply a redirect destination. */
export function eventCalendarUri(id: string): string {
  if (!validEventId(id)) throw new Error('Invalid event');
  return `${readBackendApiUrl()}/api/v1/events/${id}/calendar.ics`;
}
export function safeEventLink(value: unknown): string | null {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null;
    return url.href;
  } catch { return null; }
}
export async function organizerGet(id: string, signal: AbortSignal): Promise<PublicOrganizer> {
  if (!validEventId(id)) throw new Error('Invalid organizer');
  const response = await fetch(`${readBackendApiUrl()}/api/v1/organizers/${id}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Organizer unavailable');
  return response.json() as Promise<PublicOrganizer>;
}
