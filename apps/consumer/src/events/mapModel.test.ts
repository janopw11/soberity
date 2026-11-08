import { describe, expect, it } from '@jest/globals';
import {
  directionUrls,
  distanceKm,
  eventMarkerHtml,
  hasPreciseLocation,
  mapEventsQuery,
  mapFitTargets,
  MAP_PAGE_SIZE,
} from './mapModel';

describe('mapModel', () => {
  it('shows markers only for stored precise venue points', () => {
    expect(
      hasPreciseLocation({
        coordinate_source: 'VENUE',
        latitude: 52.2,
        longitude: 21,
      }),
    ).toBe(true);
    expect(
      hasPreciseLocation({
        coordinate_source: 'CITY',
        latitude: 52.2,
        longitude: 21,
      }),
    ).toBe(false);
    expect(
      hasPreciseLocation({
        coordinate_source: 'VENUE',
        latitude: null,
        longitude: 21,
      }),
    ).toBe(false);
  });

  it('keeps the list filters and requests the maximum page size for the map', () => {
    expect(mapEventsQuery('q=rave&category=SOBER_RAVE')).toBe(
      `?q=rave&category=SOBER_RAVE&page=0&size=${MAP_PAGE_SIZE}`,
    );
    expect(mapEventsQuery('')).toBe(`?page=0&size=${MAP_PAGE_SIZE}`);
  });

  it('builds Google Maps and Apple Maps links from stored coordinates', () => {
    const urls = directionUrls({
      latitude: 52.2297,
      longitude: 21.0122,
      title: 'Sober Rave & Co',
    });
    expect(urls.google).toBe(
      'https://www.google.com/maps/search/?api=1&query=52.2297,21.0122',
    );
    expect(urls.apple).toBe(
      'https://maps.apple.com/?ll=52.2297,21.0122&q=Sober%20Rave%20%26%20Co',
    );
  });

  it('uses the event photo for the marker when a cover exists', () => {
    const html = eventMarkerHtml(
      {
        id: 'e1',
        cover_id: 'media-1',
        cover_alt_text: 'Runners <3',
        title: 'Run',
      },
      'Sport',
      { primary: '#006C9C', onPrimary: '#FFFFFF', surface: '#FFFFFF' },
      (id) => `https://api.test/media/${id}`,
    );
    expect(html).toContain('src="https://api.test/media/media-1"');
    expect(html).toContain('alt="Runners &lt;3"');
  });

  it('falls back to the category initial on the theme colour without a cover', () => {
    const html = eventMarkerHtml(
      { id: 'e2', cover_id: null, cover_alt_text: null, title: 'Coffee' },
      'Coffee meetup',
      { primary: '#006C9C', onPrimary: '#FFFFFF', surface: '#FFFFFF' },
      () => 'unused',
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('background:#006C9C');
    expect(html).toContain('>C</div>');
  });

  it('measures distance between two points in kilometres', () => {
    const warsaw = { latitude: 52.2297, longitude: 21.0122 };
    const krakow = { latitude: 50.0647, longitude: 19.945 };
    expect(distanceKm(warsaw, krakow)).toBeGreaterThan(245);
    expect(distanceKm(warsaw, krakow)).toBeLessThan(255);
  });

  it('frames the user and the nearest events, not the whole world', () => {
    const origin = { latitude: 48.2082, longitude: 16.3738 };
    const near = { latitude: 48.21, longitude: 16.37 };
    const far = { latitude: -33.87, longitude: 151.21 };
    const targets = mapFitTargets([far, near], origin);
    expect(targets[0]).toBe(origin);
    expect(targets).toContain(near);
    expect(targets.length).toBe(3);
  });

  it('frames every event when no consented position is known', () => {
    const points = [
      { latitude: 1, longitude: 1 },
      { latitude: 2, longitude: 2 },
    ];
    expect(mapFitTargets(points, null)).toBe(points);
  });
});
