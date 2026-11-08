type Point = { latitude: number; longitude: number };

/**
 * Coordinates are rounded to three decimals (about 100 m) before they leave the device, so the
 * nearest street address is resolved without sending the exact position to the provider.
 */
export function providerPrecision(point: Point): Point {
  return {
    latitude: Math.round(point.latitude * 1000) / 1000,
    longitude: Math.round(point.longitude * 1000) / 1000,
  };
}

type Properties = {
  street?: string;
  housenumber?: string;
  city?: string;
  town?: string;
  village?: string;
  formatted?: string;
};

export type ReverseLocation = {
  /** Short street line, e.g. "Stephansplatz 4, Vienna". */
  address: string;
  /** City from Geoapify, used as the main current-location label. */
  city: string | null;
  country: string | null;
};

/** Reads the first Geoapify reverse result into a street line plus city and country. */
export function parseReverseLocation(body: unknown): ReverseLocation | null {
  const feature = (
    body as {
      features?: Array<{ properties?: Properties & { country?: string } }>;
    } | null
  )?.features?.[0];
  const properties = feature?.properties;
  if (!properties) return null;
  const street = [properties.street, properties.housenumber]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const city =
    (properties.city ?? properties.town ?? properties.village)?.trim() || null;
  const country = properties.country?.trim() || null;
  const address =
    [street, city].filter(Boolean).join(', ') ||
    properties.formatted?.trim() ||
    '';
  if (!address && !city && !country) return null;
  return { address, city, country };
}

/** Resolves the nearest location with the public Geoapify key. Returns null without a key or on failure. */
export async function reverseLocation(
  point: Point,
  signal: AbortSignal,
): Promise<ReverseLocation | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!apiKey) return null;
  const shared = providerPrecision(point);
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${shared.latitude}&lon=${shared.longitude}&limit=1&apiKey=${apiKey}`;
  try {
    const response = await fetch(url, { signal, cache: 'no-store' });
    if (!response.ok) return null;
    return parseReverseLocation(await response.json());
  } catch {
    return null;
  }
}
