import { describe, expect, it } from '@jest/globals';
import type { EventDetail } from './eventsApi';
import {
  detailAction,
  detailDates,
  detailLocation,
  detailPrice,
  isPreviewListing,
} from './eventDetailPresentation';
const event: EventDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'PUBLISHED',
  title: 'Clear nights',
  description: 'An evening of music and movement.',
  locale: 'en',
  track: 'SOBER_NIGHTLIFE',
  category_code: 'SOBER_RAVE',
  alcohol_policy: 'ALCOHOL_FREE',
  starts_at: '2029-11-06T19:00:00Z',
  ends_at: null,
  timezone: 'Europe/Vienna',
  city: 'Wien',
  city_en: 'Vienna',
  city_pl: 'Wiedeń',
  country_code: 'AT',
  country_id: 'country',
  city_id: 'city',
  region: null,
  venue_name: '',
  address: '',
  coordinate_source: 'CITY',
  price_kind: 'UNKNOWN',
  price_minor: null,
  currency: null,
  accessibility: 'UNKNOWN',
  availability: 'UNKNOWN',
  cover_id: null,
  cover_alt_text: null,
  external_ticket_url: null,
  organizer_url: 'https://example.test/organizer',
  alcohol_rules: 'No alcohol',
  beverage_notes: '0.0%',
  entry_rules: '',
  accessibility_notes: null,
};
const now = Date.parse('2029-01-01');
describe('event detail actions and optional facts', () => {
  it('chooses a valid ticket link only for an upcoming available event', () => {
    const tickets = {
      ...event,
      external_ticket_url: 'https://example.test/tickets',
    };
    expect(detailAction(tickets, null, now)?.kind).toBe('tickets');
    for (const changed of [
      { ...tickets, status: 'CANCELLED' as const },
      { ...tickets, availability: 'SOLD_OUT' as const },
      { ...tickets, ends_at: '2028-11-06T19:00:00Z' },
      { ...tickets, description: 'This is a fictional test event.' },
    ])
      expect(detailAction(changed, null, now)?.kind).toBe('organizer');
  });
  it('rejects dangerous links and never manufactures a destination', () => {
    expect(
      detailAction(
        {
          ...event,
          organizer_url: 'javascript:alert(1)',
          external_ticket_url: 'http://example.test',
        },
        null,
        now,
      ),
    ).toBeNull();
    expect(
      detailAction({ ...event, organizer_url: null }, null, now),
    ).toBeNull();
    expect(
      detailAction(
        { ...event, organizer_url: 'https://user:password@example.test' },
        null,
        now,
      ),
    ).toBeNull();
  });
  it('uses a real legacy organizer website only when no event-specific URL exists', () => {
    const organizer = {
      id: 'host',
      name: 'Host',
      description: 'Music',
      website: 'https://example.test/host',
      verification: 'VERIFIED' as const,
    };
    expect(
      detailAction({ ...event, organizer_url: null }, organizer, now)?.url,
    ).toBe(organizer.website);
    expect(detailAction(event, organizer, now)?.url).toBe(event.organizer_url);
  });
  it('shows explicit preview status and authored EN/PL test warnings', () => {
    expect(isPreviewListing({ ...event, status: 'PREVIEW' })).toBe(true);
    expect(
      isPreviewListing({
        ...event,
        description: 'To jest jawnie fikcyjne wydarzenie.',
      }),
    ).toBe(true);
    expect(
      isPreviewListing({
        ...event,
        description_document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Fictional event for demonstration.' },
              ],
            },
          ],
        },
      }),
    ).toBe(true);
    expect(isPreviewListing(event)).toBe(false);
  });
  it('preserves event-local times across midnight and DST without displaying a zone identifier', () => {
    expect(detailDates(event, 'en-GB')).toMatchObject({ time: '20:00' });
    expect(
      detailDates(
        {
          ...event,
          starts_at: '2029-03-25T00:30:00Z',
          ends_at: '2029-03-25T02:30:00Z',
        },
        'en-GB',
      )?.time,
    ).toBe('01:30 – 04:30');
    expect(
      detailDates({ ...event, ends_at: '2029-11-07T01:00:00Z' }, 'en-GB')?.time,
    ).toContain('7 Nov 2029');
    expect(detailDates({ ...event, starts_at: 'invalid' }, 'en-GB')).toBeNull();
    expect(
      detailDates({ ...event, timezone: 'Invalid/Zone' }, 'en-GB'),
    ).toBeNull();
  });
  it('uses only supplied venue/address/location data and localizes actual city names', () => {
    expect(detailLocation(event, 'pl')).toEqual({
      name: 'Wiedeń, Austria',
      detail: '',
    });
    expect(
      detailLocation(
        { ...event, venue_name: 'Real venue', address: 'Real address' },
        'en',
      ),
    ).toEqual({ name: 'Real venue', detail: 'Real address · Vienna, Austria' });
    expect(
      detailLocation(
        {
          ...event,
          city: '',
          city_en: '',
          country_code: '',
          address: '',
          venue_name: '',
        },
        'en',
      ),
    ).toBeNull();
  });
  it('omits unknown or malformed prices and respects currency minor units', () => {
    expect(detailPrice(event, 'en-GB')).toBeNull();
    expect(detailPrice({ ...event, price_kind: 'FREE' }, 'en-GB')).toBe('FREE');
    expect(
      detailPrice(
        { ...event, price_kind: 'PAID', price_minor: 1234, currency: 'EUR' },
        'en-GB',
      ),
    ).toContain('12.34');
    expect(
      detailPrice(
        { ...event, price_kind: 'PAID', price_minor: -1, currency: 'EUR' },
        'en-GB',
      ),
    ).toBeNull();
    expect(
      detailPrice(
        {
          ...event,
          price_kind: 'PAID',
          price_minor: 1234,
          currency: 'bad-code',
        },
        'en-GB',
      ),
    ).toBeNull();
  });
});
