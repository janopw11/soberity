import type { PreciseCoordinates } from './mapModel';

export const CLUSTER_RADIUS = 60;
export const CLUSTER_MAX_ZOOM = 18;
export type MapCluster<T> = PreciseCoordinates & { id: string; events: T[] };

/** Screen-distance clustering in Web Mercator; bounded by the map's 100-event API limit. */
export function clusterMapEvents<T extends PreciseCoordinates & { id: string }>(
  events: readonly T[],
  zoom: number,
): MapCluster<T>[] {
  const world = 256 * 2 ** Math.max(0, Math.min(22, zoom));
  const project = (point: T) => {
    const sin = Math.sin(
      (Math.max(-85.05112878, Math.min(85.05112878, point.latitude)) *
        Math.PI) /
        180,
    );
    return {
      x: ((point.longitude + 180) / 360) * world,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
    };
  };
  const sorted = [...events].sort((a, b) => a.id.localeCompare(b.id));
  const remaining = new Set(sorted);
  const result: MapCluster<T>[] = [];
  for (const seed of sorted) {
    if (!remaining.delete(seed)) continue;
    const anchor = project(seed);
    const members = [seed];
    for (const event of remaining) {
      const point = project(event);
      const dx = Math.abs(point.x - anchor.x) % world;
      if (
        Math.hypot(Math.min(dx, world - dx), point.y - anchor.y) <=
        CLUSTER_RADIUS
      ) {
        members.push(event);
        remaining.delete(event);
      }
    }
    const longitude =
      members.reduce(
        (sum, event) =>
          sum +
          seed.longitude +
          (((event.longitude - seed.longitude + 540) % 360) - 180),
        0,
      ) / members.length;
    result.push({
      id: JSON.stringify(members.map((event) => event.id)),
      latitude:
        members.reduce((sum, event) => sum + event.latitude, 0) /
        members.length,
      longitude: ((longitude + 540) % 360) - 180,
      events: members,
    });
  }
  return result;
}

export function zoomForLongitudeSpan(
  width: number,
  longitudeDelta: number,
): number {
  return Math.max(
    0,
    Math.min(
      22,
      Math.log2(
        (360 * Math.max(1, width)) /
          (256 * Math.max(0.000001, Math.abs(longitudeDelta))),
      ),
    ),
  );
}
