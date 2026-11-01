import { describe, expect, it } from '@jest/globals';

import { AuthNotConfiguredError } from './config';
import { mapAuthError } from './errors';
import { BackendUnavailableError } from './identityApi';

describe('mapAuthError', () => {
  it.each([
    ['auth/email-already-in-use', 'emailInUse'],
    ['auth/invalid-email', 'invalidEmail'],
    ['auth/weak-password', 'weakPassword'],
    ['auth/invalid-credential', 'invalidCredentials'],
    ['auth/wrong-password', 'invalidCredentials'],
    ['auth/user-not-found', 'invalidCredentials'],
    ['auth/too-many-requests', 'tooManyRequests'],
    ['auth/user-disabled', 'userDisabled'],
    ['auth/something-unknown', 'generic'],
  ])('maps %s to %s', (code, expected) => {
    expect(mapAuthError({ code })).toBe(expected);
  });

  it('maps configuration and network failures', () => {
    expect(mapAuthError(new AuthNotConfiguredError())).toBe('notConfigured');
    expect(mapAuthError(new BackendUnavailableError())).toBe('network');
    expect(mapAuthError(new TypeError('Network request failed'))).toBe(
      'network',
    );
  });

  it('falls back to generic for unknown values', () => {
    expect(mapAuthError(undefined)).toBe('generic');
    expect(mapAuthError('boom')).toBe('generic');
  });
});
