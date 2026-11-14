import { readBackendApiUrl } from '../auth/config';
import { eventsGet, type EventPage } from './eventsApi';

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `${readBackendApiUrl()}/api/v1/me/event-interests${path}`,
      {
        signal: controller.signal,
        method: init.method ?? 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    if (!response.ok) throw new EventInterestError(response.status);
    return response;
  } finally {
    clearTimeout(timeout);
  }
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

export type ParticipationSummary = {
  participant_count: number;
  can_join: boolean;
};
export type ParticipationState = ParticipationSummary & { declared: boolean };

function validateSummary(value: ParticipationSummary): ParticipationSummary {
  if (
    !Number.isSafeInteger(value.participant_count) ||
    value.participant_count < 0 ||
    typeof value.can_join !== 'boolean'
  ) {
    throw new Error('Invalid participation response.');
  }
  return value;
}

export async function getParticipation(
  eventId: string,
  token?: string,
): Promise<ParticipationState> {
  if (token) {
    const response = await interestRequest(
      `/${encodeURIComponent(eventId)}`,
      token,
    );
    const value = (await response.json()) as ParticipationState;
    validateSummary(value);
    if (typeof value.declared !== 'boolean')
      throw new Error('Invalid participation state.');
    return value;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const value = validateSummary(
      await eventsGet<ParticipationSummary>(
        `/${encodeURIComponent(eventId)}/participation`,
        controller.signal,
      ),
    );
    return { ...value, declared: false };
  } finally {
    clearTimeout(timeout);
  }
}
