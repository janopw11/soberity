import { readBackendApiUrl } from '../auth/config';
import type { EventPage } from './eventsApi';

export class EventInterestError extends Error {
  constructor(readonly status: number) {
    super('Event interest request failed.');
  }
}

async function interestRequest(
  path: string,
  token: string,
  init: { method?: 'GET' | 'PUT' | 'DELETE' } = {},
): Promise<Response> {
  const response = await fetch(
    `${readBackendApiUrl()}/api/v1/me/event-interests${path}`,
    {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new EventInterestError(response.status);
  return response;
}

/** Whether the signed-in user has declared "going sober" for this event. */
export async function getEventInterest(
  eventId: string,
  token: string,
): Promise<boolean> {
  const response = await interestRequest(
    `/${encodeURIComponent(eventId)}`,
    token,
  );
  return (await response.json()).declared === true;
}

/** Idempotent on the server: repeating the same declaration is harmless. */
export async function setEventInterest(
  eventId: string,
  token: string,
  declared: boolean,
): Promise<void> {
  await interestRequest(`/${encodeURIComponent(eventId)}`, token, {
    method: declared ? 'PUT' : 'DELETE',
  });
}

export async function listEventInterests(
  token: string,
  page = 0,
): Promise<EventPage> {
  const response = await interestRequest(`?page=${page}&size=20`, token);
  return (await response.json()) as EventPage;
}
