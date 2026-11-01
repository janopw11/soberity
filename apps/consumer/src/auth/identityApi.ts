import { readBackendApiUrl } from './config';

export type BackendIdentityResult = 'verified' | 'unverified' | 'rejected';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Asks the backend to validate the Firebase ID token (P0-I05). The backend is
 * the authority: a 200 means the session is accepted, 403 means the e-mail is
 * not verified yet, and 401 means the token was rejected.
 * Throws when the backend cannot be reached or fails, so callers never fall
 * back to an unverified "logged in" state.
 */
export async function fetchBackendIdentity(
  idToken: string,
): Promise<BackendIdentityResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${readBackendApiUrl()}/api/v1/identity/me`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 200) return 'verified';
    if (response.status === 403) return 'unverified';
    if (response.status === 401) return 'rejected';
    throw new BackendUnavailableError(response.status);
  } finally {
    clearTimeout(timeout);
  }
}

export class BackendUnavailableError extends Error {
  constructor(readonly status?: number) {
    super(`Backend unavailable${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'BackendUnavailableError';
  }
}
