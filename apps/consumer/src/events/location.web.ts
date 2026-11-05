import {
  boundedLocation,
  checkedPoint,
  LocationFailure,
  type LocationPermission,
  type LocationPoint,
} from './locationTypes';
export { LocationFailure } from './locationTypes';

export async function permission(): Promise<LocationPermission> {
  if (typeof navigator === 'undefined' || !navigator.geolocation)
    return 'unavailable';
  try {
    const state = await navigator.permissions.query({ name: 'geolocation' });
    return state.state;
  } catch {
    return 'unavailable';
  }
}
function position(signal: AbortSignal): Promise<LocationPoint> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.geolocation ||
    signal.aborted
  )
    return Promise.reject(new LocationFailure('unavailable'));
  return boundedLocation(
    new Promise<LocationPoint>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (value) => {
          try {
            resolve(
              checkedPoint(value.coords.latitude, value.coords.longitude),
            );
          } catch {
            reject(new LocationFailure('unavailable'));
          }
        },
        (error) =>
          reject(
            new LocationFailure(error.code === 1 ? 'denied' : 'unavailable'),
          ),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }),
    signal,
  ).catch(async (error) => {
    if (error instanceof LocationFailure && error.reason === 'denied')
      throw error;
    if ((await permission()) === 'denied') throw new LocationFailure('denied');
    throw new LocationFailure('unavailable');
  });
}
export async function requestPermission(): Promise<LocationPermission> {
  // Browsers expose no standalone permission prompt: one explicit foreground lookup asks it.
  try {
    await position(new AbortController().signal);
    return 'granted';
  } catch (error) {
    return (error instanceof LocationFailure && error.reason === 'denied') ||
      (await permission()) === 'denied'
      ? 'denied'
      : 'unavailable';
  }
}
export async function locate(signal: AbortSignal): Promise<LocationPoint> {
  const state = await permission();
  // A Home visit may never request a new permission prompt.
  if (state !== 'granted')
    throw new LocationFailure(
      state === 'denied' || state === 'prompt' ? 'denied' : 'unavailable',
    );
  return position(signal);
}
export function watchPermission(
  listener: (state: LocationPermission) => void,
): () => void {
  let disposed = false;
  let status: PermissionStatus | null = null;
  const change = () => {
    if (status && !disposed) listener(status.state);
  };
  if (typeof navigator !== 'undefined' && navigator.permissions)
    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((value) => {
        if (disposed) return;
        status = value;
        status.addEventListener('change', change);
      })
      .catch(() => undefined);
  return () => {
    disposed = true;
    status?.removeEventListener('change', change);
  };
}
