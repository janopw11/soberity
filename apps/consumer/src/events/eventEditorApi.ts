import type { JSONContent } from '@tiptap/core';
import { readBackendApiUrl } from '../auth/config';
export type Organization = { id: string; name: string; verification: string; version: number };
export type EditorEvent = { id: string; organizer_id: string; version: number; status: string; content: Record<string, unknown> & { title: string; description_document: JSONContent | null; cover_id: string | null; venue_id: string } };
export type Venue = { id: string; name: string; address: string; city: string; country_code: string; region: string | null };
export class EventEditorError extends Error {
  constructor(readonly status: number) {super(`Event editor request failed (${status})`);}
}
export async function eventEditorRequest<T>(token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${readBackendApiUrl()}/api/v1/organizer${path}`, {
      method, headers: {Authorization: `Bearer ${token}`, ...(body instanceof FormData ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: body instanceof FormData ? body : JSON.stringify(body)}),signal: controller.signal,
    });
    if (!response.ok) throw new EventEditorError(response.status);
    return response.status === 204 ? undefined as T : await response.json() as T;
  } finally {clearTimeout(timeout);}
}
export async function eventEditorImage(token: string, organization: string, id: string): Promise<string> {
  const response = await fetch(`${readBackendApiUrl()}/api/v1/organizer/organizations/${organization}/media/${id}`, {headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new EventEditorError(response.status);
  return URL.createObjectURL(await response.blob());
}
