import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthAdapter, AuthUser } from './authAdapter';
import { AuthStatusProvider, useAuthStatus } from './AuthStatusContext';
import { BackendUnavailableError, fetchBackendIdentity } from './identityApi';

jest.mock('./identityApi', () => {
  const actual =
    jest.requireActual<typeof import('./identityApi')>('./identityApi');
  return { ...actual, fetchBackendIdentity: jest.fn() };
});

const fetchMock = jest.mocked(fetchBackendIdentity);

const user: AuthUser = { uid: 'user-1', email: 'jane@example.com' };

function createFakeAdapter(token: string | null = 'id-token') {
  let listener: ((value: AuthUser | null) => void) | undefined;
  const adapter = {
    subscribe: jest.fn((next: (value: AuthUser | null) => void) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    }),
    signUp: jest.fn<(email: string, password: string) => Promise<void>>(
      async () => undefined,
    ),
    signIn: jest.fn<(email: string, password: string) => Promise<void>>(
      async () => undefined,
    ),
    sendEmailVerification: jest.fn(async () => undefined),
    reload: jest.fn(async () => undefined),
    applyEmailVerificationAction: jest.fn<(oobCode: string) => Promise<void>>(
      async () => undefined,
    ),
    requestPasswordReset: jest.fn<(email: string) => Promise<void>>(
      async () => undefined,
    ),
    checkPasswordResetCode: jest.fn<(oobCode: string) => Promise<string>>(
      async () => 'jane@example.com',
    ),
    confirmPasswordReset: jest.fn<
      (oobCode: string, newPassword: string) => Promise<void>
    >(async () => undefined),
    signOut: jest.fn(async () => undefined),
    getIdToken: jest.fn<(forceRefresh?: boolean) => Promise<string | null>>(
      async () => token,
    ),
  };
  return {
    adapter: adapter as AuthAdapter & typeof adapter,
    emit: async (value: AuthUser | null) => {
      await act(async () => {
        listener?.(value);
      });
    },
  };
}

function renderAuth(adapter: AuthAdapter) {
  return renderHook(() => useAuthStatus(), {
    wrapper: ({ children }) => (
      <AuthStatusProvider adapter={adapter}>{children}</AuthStatusProvider>
    ),
  });
}

describe('AuthStatusContext', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('stays in loading until the first auth event', async () => {
    const { adapter } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    expect(result.current?.status).toBe('loading');
  });

  it('becomes guest when no user is signed in', async () => {
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(null);

    await waitFor(() => expect(result.current?.status).toBe('guest'));
    expect(result.current?.user).toBeNull();
  });

  it('becomes authenticated only when the backend accepts the token', async () => {
    fetchMock.mockResolvedValue('verified');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);

    await waitFor(() => expect(result.current?.status).toBe('authenticated'));
    expect(result.current?.user).toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith('id-token');
  });

  it('becomes verification-pending when the backend reports an unverified account', async () => {
    fetchMock.mockResolvedValue('unverified');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);

    await waitFor(() =>
      expect(result.current?.status).toBe('verification-pending'),
    );
  });

  it('signs out and becomes guest when the backend rejects the token', async () => {
    fetchMock.mockResolvedValue('rejected');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);

    await waitFor(() => expect(result.current?.status).toBe('guest'));
    expect(adapter.signOut).toHaveBeenCalledTimes(1);
  });

  it('becomes offline when the backend cannot be reached and recovers on retry', async () => {
    fetchMock.mockRejectedValueOnce(new BackendUnavailableError());
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);

    await waitFor(() => expect(result.current?.status).toBe('offline'));
    expect(result.current?.user).toEqual(user);

    fetchMock.mockResolvedValueOnce('verified');
    await act(async () => {
      await result.current?.retry();
    });

    await waitFor(() => expect(result.current?.status).toBe('authenticated'));
  });

  it('delegates auth actions to the adapter', async () => {
    const { adapter } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await act(async () => {
      await result.current?.signIn('jane@example.com', 'secret-password');
      await result.current?.signUp('new@example.com', 'secret-password');
      await result.current?.resendVerificationEmail();
      await result.current?.refreshVerificationStatus();
      await result.current?.applyEmailVerificationAction('oob-code');
      await result.current?.signOut();
    });

    expect(adapter.signIn).toHaveBeenCalledWith(
      'jane@example.com',
      'secret-password',
    );
    expect(adapter.signUp).toHaveBeenCalledWith(
      'new@example.com',
      'secret-password',
    );
    expect(adapter.sendEmailVerification).toHaveBeenCalledTimes(1);
    expect(adapter.reload).toHaveBeenCalledTimes(1);
    expect(adapter.applyEmailVerificationAction).toHaveBeenCalledWith(
      'oob-code',
    );
    expect(adapter.signOut).toHaveBeenCalledTimes(1);
  });

  it('forces a fresh token when checking verification status', async () => {
    fetchMock.mockResolvedValue('unverified');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);
    await waitFor(() =>
      expect(result.current?.status).toBe('verification-pending'),
    );

    fetchMock.mockResolvedValue('verified');
    await act(async () => {
      await result.current?.refreshVerificationStatus();
    });

    expect(adapter.getIdToken).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(result.current?.status).toBe('authenticated'));
  });

  it('restores a persisted session on startup without signing in again', async () => {
    fetchMock.mockResolvedValue('verified');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);

    await waitFor(() => expect(result.current?.status).toBe('authenticated'));
    expect(adapter.signIn).not.toHaveBeenCalled();
    expect(adapter.getIdToken).toHaveBeenLastCalledWith(false);
  });

  it('clears the session locally on sign-out and ignores late backend answers', async () => {
    let resolveIdentity: ((value: 'verified') => void) | undefined;
    fetchMock.mockResolvedValueOnce('verified');
    const { adapter, emit } = createFakeAdapter();
    const { result } = await renderAuth(adapter);

    await emit(user);
    await waitFor(() => expect(result.current?.status).toBe('authenticated'));

    // A slow backend answer from before logout must not restore the session.
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => (resolveIdentity = resolve)),
    );
    await act(async () => {
      void result.current?.refreshVerificationStatus();
    });
    await act(async () => {
      await result.current?.signOut();
    });
    await act(async () => {
      resolveIdentity?.('verified');
    });

    expect(result.current?.status).toBe('guest');
    expect(result.current?.user).toBeNull();
    expect(adapter.signOut).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error outside of its provider', async () => {
    await expect(renderHook(() => useAuthStatus())).rejects.toThrow(
      'useAuthStatus must be used within an AuthStatusProvider',
    );
  });
});
