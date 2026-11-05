import * as Location from 'expo-location';
import {
  boundedLocation,
  checkedPoint,
  LocationFailure,
  type LocationPermission,
  type LocationPoint,
} from './locationTypes';
export { LocationFailure } from './locationTypes';

export async function permission(): Promise<LocationPermission> {
  try {
    const value = await Location.getForegroundPermissionsAsync();
    return value.granted
      ? 'granted'
      : value.status === 'denied'
        ? 'denied'
        : 'prompt';
  } catch {
    return 'unavailable';
  }
}
/** Called only by the explicit preferences action, never by rendering/Home focus. */
export async function requestPermission(): Promise<LocationPermission> {
  try {
    return (await Location.requestForegroundPermissionsAsync()).granted
      ? 'granted'
      : 'denied';
  } catch {
    return 'unavailable';
  }
}
export async function locate(signal: AbortSignal): Promise<LocationPoint> {
  const state = await permission();
  if (state !== 'granted')
    throw new LocationFailure(
      state === 'denied' || state === 'prompt' ? 'denied' : 'unavailable',
    );
  if (signal.aborted || !(await Location.hasServicesEnabledAsync()))
    throw new LocationFailure('unavailable');
  const position = await boundedLocation(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
    }),
    signal,
  );
  return checkedPoint(position.coords.latitude, position.coords.longitude);
}
/** Foreground permission changes are rechecked through AppState; no position subscription. */
export function watchPermission(
  listener: (state: LocationPermission) => void,
): () => void {
  void listener;
  return () => undefined;
}
