import { AuthNotConfiguredError } from './config';
import { BackendUnavailableError } from './identityApi';

export type AuthErrorKey =
  | 'emailInUse'
  | 'invalidEmail'
  | 'weakPassword'
  | 'invalidCredentials'
  | 'tooManyRequests'
  | 'userDisabled'
  | 'network'
  | 'notConfigured'
  | 'generic';

/**
 * Maps Firebase Auth and backend errors to user-facing message keys.
 * Wrong password and unknown e-mail share one message to avoid account enumeration.
 */
export function mapAuthError(error: unknown): AuthErrorKey {
  if (error instanceof AuthNotConfiguredError) return 'notConfigured';
  if (error instanceof BackendUnavailableError || error instanceof TypeError) {
    return 'network';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'emailInUse';
    case 'auth/invalid-email':
      return 'invalidEmail';
    case 'auth/weak-password':
      return 'weakPassword';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'invalidCredentials';
    case 'auth/too-many-requests':
      return 'tooManyRequests';
    case 'auth/user-disabled':
      return 'userDisabled';
    case 'auth/network-request-failed':
      return 'network';
    case 'auth/not-configured':
      return 'notConfigured';
    default:
      return 'generic';
  }
}
