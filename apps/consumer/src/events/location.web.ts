export const canLocate = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
/** One foreground lookup only after an explicit click. Never watches or persists position. */
export function locate(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!canLocate) { reject(new Error('Device location unavailable')); return; }
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => reject(new Error('Device location unavailable')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
