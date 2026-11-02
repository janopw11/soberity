import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { firebaseAuthAdapter } from './authAdapter';

const mockSendPasswordResetEmail =
  jest.fn<
    (auth: unknown, email: string, settings?: unknown) => Promise<void>
  >();
const mockVerifyPasswordResetCode =
  jest.fn<(auth: unknown, code: string) => Promise<string>>();

jest.mock('firebase/auth', () => ({
  applyActionCode: jest.fn(),
  confirmPasswordReset: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  onIdTokenChanged: jest.fn(),
  reload: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...(args as [unknown, string, unknown?])),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  verifyPasswordResetCode: (...args: unknown[]) =>
    mockVerifyPasswordResetCode(...(args as [unknown, string])),
}));

jest.mock('./firebaseInstance', () => ({
  getFirebaseAuth: () => ({ name: 'fake-auth' }),
}));

describe('firebaseAuthAdapter password reset', () => {
  beforeEach(() => {
    mockSendPasswordResetEmail.mockReset();
    mockVerifyPasswordResetCode.mockReset();
  });

  it('treats an unknown address like a known one (no account enumeration)', async () => {
    mockSendPasswordResetEmail.mockRejectedValue(
      Object.assign(new Error('nope'), { code: 'auth/user-not-found' }),
    );

    await expect(
      firebaseAuthAdapter.requestPasswordReset('ghost@example.com'),
    ).resolves.toBeUndefined();
  });

  it('propagates other failures such as rate limiting', async () => {
    mockSendPasswordResetEmail.mockRejectedValue(
      Object.assign(new Error('slow down'), {
        code: 'auth/too-many-requests',
      }),
    );

    await expect(
      firebaseAuthAdapter.requestPasswordReset('jane@example.com'),
    ).rejects.toMatchObject({ code: 'auth/too-many-requests' });
  });

  it('rejects an expired reset code instead of returning an e-mail', async () => {
    mockVerifyPasswordResetCode.mockRejectedValue(
      Object.assign(new Error('expired'), {
        code: 'auth/expired-action-code',
      }),
    );

    await expect(
      firebaseAuthAdapter.checkPasswordResetCode('old-code'),
    ).rejects.toMatchObject({ code: 'auth/expired-action-code' });
  });
});
