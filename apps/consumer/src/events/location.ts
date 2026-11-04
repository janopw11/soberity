/** Native fallback: manual coordinates work without requesting device permissions. */
export const canLocate = false;
export async function locate(): Promise<{ latitude: number; longitude: number }> {
  throw new Error('Device location unavailable');
}
