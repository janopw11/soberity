import { describe, expect, it } from '@jest/globals';
import { addressSelection, placeAddressPoint } from './addressSelection';

describe('addressSelection', () => {
  it('stores building results as ADDRESS with the selected point', () => {
    expect(
      addressSelection({
        formatted: 'Marszałkowska 1, 00-001 Warszawa, Poland',
        housenumber: '1',
        street: 'Marszałkowska',
        postcode: '00-001',
        city: 'Warszawa',
        country_code: 'pl',
        place_id: 'place-1',
        result_type: 'building',
        lat: 52.23,
        lon: 21.01,
      }),
    ).toEqual({
      formattedAddress: 'Marszałkowska 1, 00-001 Warszawa, Poland',
      street: 'Marszałkowska',
      buildingNumber: '1',
      postalCode: '00-001',
      city: 'Warszawa',
      countryCode: 'PL',
      providerPlaceId: 'place-1',
      latitude: 52.23,
      longitude: 21.01,
      center: { latitude: 52.23, longitude: 21.01 },
      locationPrecision: 'ADDRESS',
    });
  });

  it('stores amenity results as VENUE', () => {
    const result = addressSelection({
      result_type: 'amenity',
      lat: 50.06,
      lon: 19.94,
    });
    expect(result.locationPrecision).toBe('VENUE');
    expect(result.latitude).toBe(50.06);
  });

  it('treats street and city results as CITY without a stored point but keeps a preview centre', () => {
    const result = addressSelection({
      formatted: 'Warszawa, Poland',
      result_type: 'city',
      lat: 52.23,
      lon: 21.01,
    });
    expect(result.locationPrecision).toBe('CITY');
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.center).toEqual({ latitude: 52.23, longitude: 21.01 });
  });

  it('downgrades a building without coordinates to CITY', () => {
    const result = addressSelection({ result_type: 'building' });
    expect(result.locationPrecision).toBe('CITY');
    expect(result.latitude).toBeNull();
    expect(result.center).toBeNull();
  });

  it('confirms a CITY result as VENUE when the administrator places the marker', () => {
    const city = addressSelection({
      result_type: 'city',
      lat: 52.23,
      lon: 21.01,
    });
    const placed = placeAddressPoint(city, 52.2312, 21.0088);
    expect(placed.locationPrecision).toBe('VENUE');
    expect(placed.latitude).toBe(52.2312);
    expect(placed.longitude).toBe(21.0088);
    expect(placed.center).toEqual({ latitude: 52.2312, longitude: 21.0088 });
  });

  it('keeps ADDRESS precision when the administrator moves an existing marker', () => {
    const building = addressSelection({
      result_type: 'building',
      lat: 52.23,
      lon: 21.01,
    });
    const moved = placeAddressPoint(building, 52.24, 21.02);
    expect(moved.locationPrecision).toBe('ADDRESS');
    expect(moved.latitude).toBe(52.24);
  });
});
