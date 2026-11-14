import { readBackendApiUrl } from '../auth/config';
import type { Page } from '../science/scienceApi';
export const circleCategories = [
  'NIGHTLIFE',
  'FITNESS',
  'COFFEE',
  'WELLBEING',
  'OUTDOORS',
  'ART',
  'GAMES',
] as const;
export type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  cover_id: string | null;
  cover_alt: string | null;
  guidelines: string;
  active: boolean;
  member_count: number;
  joined: boolean;
  version: number;
  event_ids?: string[];
};
export type CirclePage = Page<Circle>;
export class CircleError extends Error {
  constructor(readonly status: number) {
    super('Circle request failed');
  }
}
export async function circleRequest<T>(
  path: string,
  token?: string | null,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${readBackendApiUrl()}/api/v1${path}`, {
      method,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new CircleError(response.status);
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  } finally {
    clearTimeout(timeout);
  }
}
export const circleImage = (id: string) =>
  `${readBackendApiUrl()}/api/v1/circles/media/${encodeURIComponent(id)}`;
