import { describe, expect, it } from '@jest/globals';
import { parseReverseLocation, providerPrecision } from './reverseGeocode';

describe('reverseGeocode', () => {
  it('shares only a rounded point with the provider', () => {
    expect(
      providerPrecision({ latitude: 48.208212, longitude: 16.373849 }),
    ).toEqual({
      latitude: 48.208,
      longitude: 16.374,
    });
  });

  it('returns the city and country separately, plus a street line', () => {
    expect(
      parseReverseLocation({
        features: [
          {
            properties: {
              street: 'Mariahilfer Straße',
              housenumber: '12',
              city: 'Wien',
              country: 'Austria',
              formatted: 'ignored',
            },
          },
        ],
      }),
    ).toEqual({
      address: 'Mariahilfer Straße 12, Wien',
      city: 'Wien',
      country: 'Austria',
    });
  });

  it('uses the town as city when no city is given', () => {
    expect(
      parseReverseLocation({
        features: [
          {
            properties: {
              town: 'Graz',
              country: 'Austria',
              formatted: 'Graz, Austria',
            },
          },
        ],
      }),
    ).toEqual({ address: 'Graz', city: 'Graz', country: 'Austria' });
  });

  it('keeps the country when no city is known', () => {
    expect(
      parseReverseLocation({
        features: [
          { properties: { country: 'Austria', formatted: 'Austria' } },
        ],
      }),
    ).toEqual({ address: 'Austria', city: null, country: 'Austria' });
  });

  it('returns null for an empty or malformed response', () => {
    expect(parseReverseLocation({ features: [] })).toBeNull();
    expect(parseReverseLocation(null)).toBeNull();
  });
});
