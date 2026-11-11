import { describe, expect, it } from '@jest/globals';
import { clusterMapEvents, zoomForLongitudeSpan } from './mapClusters';

const vienna = { id: 'a', latitude: 48.2082, longitude: 16.3738 };
const nearby = { id: 'b', latitude: 48.21, longitude: 16.38 };
const london = { id: 'c', latitude: 51.5, longitude: -0.12 };

describe('map clusters', () => {
  it('groups nearby events when zoomed out and separates them at street level', () => {
    const overview = clusterMapEvents([vienna, nearby, london], 7);
    expect(overview.map((group) => group.events.length)).toEqual([2, 1]);
    expect(clusterMapEvents([vienna, nearby], 18)).toHaveLength(2);
  });
  it('keeps every event exactly once and is independent of API ordering', () => {
    const events = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      latitude: i % 70,
      longitude: i % 160,
    }));
    const groups = clusterMapEvents(events, 2);
    expect(
      groups
        .flatMap((group) => group.events)
        .map((event) => event.id)
        .sort(),
    ).toEqual(events.map((event) => event.id).sort());
    expect(clusterMapEvents([...events].reverse(), 2)).toEqual(groups);
  });
  it('retains coincident events in a selectable group even at maximum zoom', () => {
    const groups = clusterMapEvents([vienna, { ...vienna, id: 'b' }], 18);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.events).toHaveLength(2);
  });
  it('handles the date line and polar coordinates without placing a group on the opposite side', () => {
    const groups = clusterMapEvents(
      [
        { id: 'a', latitude: 0, longitude: 179.9 },
        { id: 'b', latitude: 0, longitude: -179.9 },
      ],
      3,
    );
    expect(groups).toHaveLength(1);
    expect(Math.abs(groups[0]!.longitude)).toBeCloseTo(180);
    expect(
      clusterMapEvents([{ id: 'pole', latitude: 90, longitude: 0 }], 5)[0]
        ?.latitude,
    ).toBe(90);
  });
  it('handles empty/filtered results and estimates native zoom from the actual map width', () => {
    expect(clusterMapEvents([], 2)).toEqual([]);
    expect(clusterMapEvents([vienna], 2)[0]?.events).toEqual([vienna]);
    expect(zoomForLongitudeSpan(256, 360)).toBe(0);
    expect(zoomForLongitudeSpan(512, 180)).toBe(2);
  });
});
