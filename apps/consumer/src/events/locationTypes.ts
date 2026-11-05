export type LocationPermission =
  'granted' | 'denied' | 'prompt' | 'unavailable';
export type LocationPoint = { latitude: number; longitude: number };
export class LocationFailure extends Error {
  constructor(readonly reason: 'denied' | 'unavailable') {
    super('Location unavailable');
  }
}
/** Bounds one-shot OS work; late completions cannot escape an aborted consumer. */
export function boundedLocation<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  milliseconds = 12000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (value: T | null, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve(value as T);
    };
    const abort = () => finish(null, new LocationFailure('unavailable'));
    const timer = setTimeout(abort, milliseconds);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    void operation.then(
      (value) => finish(value),
      (error) =>
        finish(
          null,
          error instanceof LocationFailure
            ? error
            : new LocationFailure('unavailable'),
        ),
    );
  });
}
export function checkedPoint(
  latitude: number,
  longitude: number,
): LocationPoint {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    throw new LocationFailure('unavailable');
  return { latitude, longitude };
}
