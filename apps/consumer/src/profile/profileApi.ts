import { readBackendApiUrl } from '../auth/config';
import { BackendUnavailableError } from '../auth/identityApi';

export type ProfileLocale = 'en' | 'pl';
export type ProfileInterest = 'science' | 'sport' | 'events' | 'community';

export const PROFILE_INTERESTS: readonly ProfileInterest[] = [
  'science',
  'sport',
  'events',
  'community',
];

export type Profile = {
  id: string;
  displayName: string | null;
  city: string | null;
  interests: ProfileInterest[];
  locale: ProfileLocale | null;
  updatedAt: string;
};

export type ProfilePatch = {
  displayName?: string;
  city?: string;
  interests?: ProfileInterest[];
  locale?: ProfileLocale;
};

/** The backend has no profile for this account yet (HTTP 404). */
export class ProfileNotFoundError extends Error {
  constructor() {
    super('Profile not found.');
    this.name = 'ProfileNotFoundError';
  }
}

/** The backend refused the request (HTTP 4xx such as 400 validation). */
export class ProfileRejectedError extends Error {
  constructor(readonly status: number) {
    super(`Profile request rejected (HTTP ${status}).`);
    this.name = 'ProfileRejectedError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(
  idToken: string,
  init: { method: 'GET' | 'POST' | 'PATCH'; body?: unknown },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${readBackendApiUrl()}/api/v1/me`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
        ...(init.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
      },
      body: init.body === undefined ? null : JSON.stringify(init.body),
      signal: controller.signal,
    });
  } catch {
    throw new BackendUnavailableError();
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 404) throw new ProfileNotFoundError();
  if (response.status >= 500)
    throw new BackendUnavailableError(response.status);
  if (!response.ok) throw new ProfileRejectedError(response.status);
  return (await response.json()) as T;
}

/**
 * Backend calls for the signed-in user's own profile. The token identifies the
 * owner; no user identifier is sent from the client.
 */
export const profileApi = {
  /** Creates the profile on first use. `initialLocale` is applied only when creating it. */
  provision(idToken: string, initialLocale: ProfileLocale | null) {
    return request<Profile>(idToken, {
      method: 'POST',
      body: initialLocale ? { initialLocale } : {},
    });
  },
  get(idToken: string) {
    return request<Profile>(idToken, { method: 'GET' });
  },
  update(idToken: string, patch: ProfilePatch) {
    return request<Profile>(idToken, { method: 'PATCH', body: patch });
  },
};
