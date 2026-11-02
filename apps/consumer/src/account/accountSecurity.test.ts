import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  readAccountLocale,
  writeAccountLocale,
} from '../profile/accountLocale';
import {
  changePassword,
  deleteAccount,
  hasPendingDeletion,
  type AccountSecurityDeps,
} from './accountSecurity';

function makeDeps(
  uid: string,
  overrides: Partial<AccountSecurityDeps> = {},
): AccountSecurityDeps & {
  reauthenticate: jest.Mock<(password: string) => Promise<void>>;
  updatePassword: jest.Mock<(password: string) => Promise<void>>;
  deleteUser: jest.Mock<() => Promise<void>>;
  deleteBackendData: jest.Mock<(token: string) => Promise<void>>;
} {
  return {
    uid,
    getToken: jest.fn(async () => `token-${uid}`),
    reauthenticate: jest.fn<(password: string) => Promise<void>>(
      async () => undefined,
    ),
    updatePassword: jest.fn<(password: string) => Promise<void>>(
      async () => undefined,
    ),
    deleteUser: jest.fn<() => Promise<void>>(async () => undefined),
    deleteBackendData: jest.fn<(token: string) => Promise<void>>(
      async () => undefined,
    ),
    ...overrides,
  } as never;
}

const recentLogin = () =>
  Promise.reject(
    Object.assign(new Error('recent'), { code: 'auth/requires-recent-login' }),
  );

describe('account security operations', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('password and e-mail changes', () => {
    it('re-checks the password before changing it', async () => {
      const deps = makeDeps('uid-a');

      await changePassword(deps, 'old-secret', 'new-secret-1');

      expect(deps.reauthenticate).toHaveBeenCalledWith('old-secret');
      expect(deps.updatePassword).toHaveBeenCalledWith('new-secret-1');
      expect(deps.reauthenticate.mock.invocationCallOrder[0]).toBeLessThan(
        deps.updatePassword.mock.invocationCallOrder[0] ?? 0,
      );
    });

    it('does not change the password when the session is stale', async () => {
      const deps = makeDeps('uid-a', {
        reauthenticate: jest.fn(recentLogin) as never,
      });

      await expect(
        changePassword(deps, 'old-secret', 'new-secret-1'),
      ).rejects.toMatchObject({ code: 'auth/requires-recent-login' });
      expect(deps.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('account deletion', () => {
    it('removes nothing when the password check fails', async () => {
      const deps = makeDeps('uid-a', {
        reauthenticate: jest.fn(recentLogin) as never,
      });

      await expect(deleteAccount(deps, 'wrong')).rejects.toThrow();

      expect(deps.deleteBackendData).not.toHaveBeenCalled();
      expect(deps.deleteUser).not.toHaveBeenCalled();
      expect(await hasPendingDeletion('uid-a')).toBe(false);
    });

    it('stops before the Firebase account when the backend data cannot be deleted', async () => {
      const deps = makeDeps('uid-a', {
        deleteBackendData: jest.fn(async () => {
          throw new Error('offline');
        }) as never,
      });

      await expect(deleteAccount(deps, 'secret-123')).rejects.toThrow(
        'offline',
      );

      expect(deps.deleteUser).not.toHaveBeenCalled();
      expect(await hasPendingDeletion('uid-a')).toBe(true);
    });

    it('resumes a partially failed deletion without losing the other accounts on the device', async () => {
      await writeAccountLocale('uid-a', { locale: 'pl', pending: false });
      await writeAccountLocale('uid-b', { locale: 'en', pending: true });
      const deps = makeDeps('uid-a', {
        deleteUser: jest
          .fn<() => Promise<void>>()
          .mockRejectedValueOnce(new Error('network'))
          .mockResolvedValueOnce(undefined) as never,
      });

      await expect(deleteAccount(deps, 'secret-123')).rejects.toThrow(
        'network',
      );
      expect(await hasPendingDeletion('uid-a')).toBe(true);

      // The user retries; the backend call is repeated and Firebase is deleted this time.
      await deleteAccount(deps, 'secret-123');

      expect(deps.deleteBackendData).toHaveBeenCalledTimes(2);
      expect(deps.deleteUser).toHaveBeenCalledTimes(2);
      expect(await hasPendingDeletion('uid-a')).toBe(false);
      expect(await readAccountLocale('uid-a')).toBeNull();
      expect(await readAccountLocale('uid-b')).toEqual({
        locale: 'en',
        pending: true,
      });
    });
  });
});
