import type { JSONContent } from '@tiptap/core';
import { readBackendApiUrl } from '../auth/config';
export type EditorEvent = {
  id: string;
  version: number;
  status: string;
  content: Record<string, unknown> & {
    title: string;
    description_document: JSONContent | null;
    cover_id: string;
    country_id: string;
    city_id: string;
  };
};
export type EventLibrary = {
  items: {
    id: string;
    title: string;
    status: string;
    version: number;
    city_en?: string;
    city_pl?: string;
    country_en?: string;
    country_pl?: string;
  }[];
  total: number;
  page: number;
  size: number;
};
export class EventEditorError extends Error {
  constructor(readonly status: number) {
    super(`Event editor request failed (${status})`);
  }
}
export async function eventEditorRequest<T>(
  token: string,
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      `${readBackendApiUrl()}/api/v1/admin/events${path}`,
      {
        method,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body instanceof FormData
            ? {}
            : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined
          ? {}
          : { body: body instanceof FormData ? body : JSON.stringify(body) }),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new EventEditorError(response.status);
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  } finally {
    clearTimeout(timeout);
  }
}
export async function eventEditorImage(
  token: string,
  id: string,
): Promise<string> {
  const response = await fetch(
    `${readBackendApiUrl()}/api/v1/admin/events/media/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) throw new EventEditorError(response.status);
  return URL.createObjectURL(await response.blob());
}
