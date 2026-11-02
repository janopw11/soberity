import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { render } from './test-utils';
import AccountScreen from './AccountScreen';

const mockPush = jest.fn();
const mockSignOut = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('./auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({
    user: { uid: 'uid-1', email: 'me@example.com' },
    signOut: mockSignOut,
    getIdToken: async () => 'token',
    accountActions: {
      reauthenticate: async () => undefined,
      updatePassword: async () => undefined,
      verifyNewEmail: async () => undefined,
      deleteUser: async () => undefined,
    },
  }),
}));

describe('AccountScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockClear();
  });

  it('lists the three settings rows as navigation rows', async () => {
    await render(<AccountScreen />);

    expect(screen.getByTestId('account-row-personal-data')).toBeTruthy();
    expect(screen.getByTestId('account-row-password')).toBeTruthy();
    expect(screen.getByTestId('account-row-preferences')).toBeTruthy();
  });

  it('opens each section as its own screen', async () => {
    await render(<AccountScreen />);

    await fireEvent.press(screen.getByTestId('account-row-personal-data'));
    await fireEvent.press(screen.getByTestId('account-row-password'));
    await fireEvent.press(screen.getByTestId('account-row-preferences'));

    expect(mockPush.mock.calls).toEqual([
      ['/account-personal-data'],
      ['/account-password'],
      ['/account-preferences'],
    ]);
  });

  it('signs out from the subtle sign-out row', async () => {
    await render(<AccountScreen />);

    await fireEvent.press(screen.getByTestId('account-sign-out'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('asks for the password in a modal before deleting the account', async () => {
    await render(<AccountScreen />);

    expect(screen.queryByTestId('account-delete-password')).toBeNull();

    await fireEvent.press(screen.getByTestId('account-delete'));

    expect(screen.getByTestId('account-delete-dialog')).toBeTruthy();
    expect(screen.getByTestId('account-delete-password')).toBeTruthy();
  });
});
