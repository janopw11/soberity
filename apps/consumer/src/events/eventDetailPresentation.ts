import { documentText } from '../science/scienceApi';
import {
  safeEventLink,
  type DiscoveryEvent,
  type EventDetail,
  type PublicOrganizer,
} from './eventsApi';

export type DetailAction = { kind: 'tickets' | 'organizer'; url: string };
const text = (value: string | null | undefined) => value?.trim() ?? '';

/** Keep explicit preview status and warnings in authored content visible outside the description. */
export function isPreviewListing(
  event: Pick<DiscoveryEvent, 'title' | 'status'> &
    Partial<Pick<EventDetail, 'description' | 'description_document'>>,
) {
  if (event.status === 'PREVIEW') return true;
  const content = [
    event.title,
    event.description,
    event.description_document ? documentText(event.description_document) : '',
  ].join(' ');
  return /\b(fictional|fictitious|synthetic|demo|preview|test event)\b|fikcyjn\p{L}*|wydarzen\p{L}*\s+testow\p{L}*|testow\p{L}*\s+wydarzen/iu.test(
    content,
  );
}
export function eventIsActive(event: EventDetail, now: number) {
  return (
    event.status === 'PUBLISHED' &&
    new Date(event.ends_at ?? event.starts_at).getTime() > now
  );
}
export function detailAction(
  event: EventDetail,
  organizer: PublicOrganizer | null,
  now: number,
): DetailAction | null {
  const tickets = safeEventLink(event.external_ticket_url);
  if (
    tickets &&
    eventIsActive(event, now) &&
    event.availability !== 'SOLD_OUT' &&
    !isPreviewListing(event)
  )
    return { kind: 'tickets', url: tickets };
  const website = safeEventLink(event.organizer_url ?? organizer?.website);
  return website ? { kind: 'organizer', url: website } : null;
}
export function detailDates(event: EventDetail, locale: string) {
  try {
    const start = new Date(event.starts_at);
    if (!Number.isFinite(start.getTime())) return null;
    const format = (value: Date, options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, {
        ...options,
        timeZone: event.timezone,
      }).format(value);
    const day = format(start, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const time = format(start, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const end = event.ends_at ? new Date(event.ends_at) : null;
    if (!end || !Number.isFinite(end.getTime()) || end < start)
      return { day, time };
    const sameDay =
      format(start, { dateStyle: 'short' }) ===
      format(end, { dateStyle: 'short' });
    return {
      day,
      time: `${time} – ${format(end, sameDay ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { dateStyle: 'medium', timeStyle: 'short' })}`,
    };
  } catch {
    return null;
  }
}
export function detailLocation(event: EventDetail, language: string) {
  const city = text(
    language === 'pl'
      ? (event.city_pl ?? event.city)
      : (event.city_en ?? event.city),
  );
  let country = text(event.country_code);
  if (/^[A-Z]{2}$/.test(country)) {
    try {
      country =
        new Intl.DisplayNames([language], { type: 'region' }).of(country) ??
        country;
    } catch {
      /* Keep the actual country code. */
    }
  }
  const area = [city, country].filter(Boolean).join(', ');
  const venue = text(event.venue_name);
  const address = text(event.address);
  if (!area && !venue && !address) return null;
  const name = venue || area || address;
  return {
    name,
    detail: [address !== name ? address : '', area !== name ? area : '']
      .filter(Boolean)
      .join(' · '),
  };
}
export function detailPrice(
  event: EventDetail,
  locale: string,
): string | 'FREE' | null {
  if (event.price_kind === 'FREE') return 'FREE';
  if (
    event.price_kind !== 'PAID' ||
    !Number.isSafeInteger(event.price_minor) ||
    event.price_minor === null ||
    event.price_minor <= 0 ||
    !/^[A-Z]{3}$/.test(event.currency ?? '')
  )
    return null;
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: event.currency!,
    });
    return formatter.format(
      event.price_minor /
        10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2),
    );
  } catch {
    return null;
  }
}
