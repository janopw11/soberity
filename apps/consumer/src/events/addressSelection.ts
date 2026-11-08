export type AddressPrecision = 'ADDRESS' | 'VENUE' | 'CITY';

/** Subset of the Geoapify autocomplete feature properties used by Soberity. */
export type GeoapifyProperties = {
  formatted?: string;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  country_code?: string;
  place_id?: string;
  result_type?: string;
  lat?: number;
  lon?: number;
};

export type AddressSelection = {
  formattedAddress: string;
  street: string | null;
  buildingNumber: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  providerPlaceId: string | null;
  /** Stored point; null unless the precision is ADDRESS or VENUE. */
  latitude: number | null;
  longitude: number | null;
  /** Preview point for the map; never saved for CITY precision until an administrator confirms it. */
  center: { latitude: number; longitude: number } | null;
  locationPrecision: AddressPrecision;
};

const basePrecision = (resultType?: string): AddressPrecision | null => {
  if (resultType === 'building') return 'ADDRESS';
  if (resultType === 'amenity') return 'VENUE';
  return null;
};

/**
 * Maps a Geoapify result to stored location fields. Coordinates come only from the selected
 * result. Street, city or other coarse results are CITY precision with no point, so they never
 * publish a marker until the administrator confirms a precise position.
 */
export function addressSelection(
  properties: GeoapifyProperties,
): AddressSelection {
  const base = basePrecision(properties.result_type);
  const hasPoint =
    Number.isFinite(properties.lat) && Number.isFinite(properties.lon);
  const locationPrecision: AddressPrecision = base && hasPoint ? base : 'CITY';
  const exact = locationPrecision !== 'CITY';
  return {
    formattedAddress: properties.formatted?.trim() ?? '',
    street: properties.street?.trim() || null,
    buildingNumber: properties.housenumber?.trim() || null,
    postalCode: properties.postcode?.trim() || null,
    city: properties.city?.trim() || null,
    countryCode: properties.country_code?.toUpperCase() ?? null,
    providerPlaceId: properties.place_id ?? null,
    latitude: exact ? (properties.lat as number) : null,
    longitude: exact ? (properties.lon as number) : null,
    center: hasPoint
      ? {
          latitude: properties.lat as number,
          longitude: properties.lon as number,
        }
      : null,
    locationPrecision,
  };
}

/**
 * Administrator places or moves the marker on the preview map. This confirms the position:
 * a CITY result becomes VENUE, and only then do coordinates become storable.
 */
export function placeAddressPoint(
  selection: AddressSelection,
  latitude: number,
  longitude: number,
): AddressSelection {
  const locationPrecision: AddressPrecision =
    selection.locationPrecision === 'CITY'
      ? 'VENUE'
      : selection.locationPrecision;
  return {
    ...selection,
    latitude,
    longitude,
    center: { latitude, longitude },
    locationPrecision,
  };
}
