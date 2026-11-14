import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import { CircleMembership } from './CircleCard';
import type { Circle } from './circlesApi';
const mockRequest = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockToken = jest.fn<() => Promise<string | null>>();
const mockPush = jest.fn();
let mockUser = { uid: 'alice' };
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({
    status: 'authenticated',
    user: mockUser,
    getIdToken: mockToken,
  }),
}));
jest.mock('./circlesApi', () => ({
  circleRequest: (...args: unknown[]) => mockRequest(...args),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const circle = { id: 'circle', active: true, joined: false } as Circle;
beforeEach(() => {
  mockRequest.mockReset().mockResolvedValue(undefined);
  mockToken.mockReset().mockResolvedValue('token');
  mockUser = { uid: 'alice' };
});
it('joins and leaves through the own-account endpoint then refreshes server data', async () => {
  const changed = jest.fn();
  const view = await render(
    <CircleMembership circle={circle} onChanged={changed} />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Join Circle' }));
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
  expect(mockRequest).toHaveBeenCalledWith(
    '/me/circles/circle',
    'token',
    'PUT',
  );
  await view.rerender(
    <CircleMembership
      circle={{ ...circle, joined: true }}
      onChanged={changed}
    />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Leave Circle' }));
  await waitFor(() =>
    expect(mockRequest).toHaveBeenLastCalledWith(
      '/me/circles/circle',
      'token',
      'DELETE',
    ),
  );
});
it('requires refresh after an uncertain write instead of assuming membership', async () => {
  mockRequest.mockRejectedValueOnce(new Error('timeout'));
  const changed = jest.fn();
  await render(<CircleMembership circle={circle} onChanged={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Join Circle' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy(),
  );
  expect(screen.queryByRole('button', { name: 'Join Circle' })).toBeNull();
  expect(changed).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh' }));
  expect(changed).toHaveBeenCalledTimes(1);
});
it('ignores pending completion after an account switch', async () => {
  let resolve!: () => void;
  mockRequest.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const changed = jest.fn();
  const view = await render(
    <CircleMembership circle={circle} onChanged={changed} />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Join Circle' }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  mockUser = { uid: 'bob' };
  await view.rerender(<CircleMembership circle={circle} onChanged={changed} />);
  await act(async () => resolve());
  expect(changed).not.toHaveBeenCalled();
});
it('allows leaving an inactive circle but not joining it', async () => {
  const view = await render(
    <CircleMembership
      circle={{ ...circle, active: false }}
      onChanged={() => {}}
    />,
  );
  expect(
    screen.getByRole('button', { name: 'Join Circle' }).props.accessibilityState
      .disabled,
  ).toBe(true);
  await view.rerender(
    <CircleMembership
      circle={{ ...circle, active: false, joined: true }}
      onChanged={() => {}}
    />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Leave Circle' }));
  await waitFor(() =>
    expect(mockRequest).toHaveBeenCalledWith(
      '/me/circles/circle',
      'token',
      'DELETE',
    ),
  );
});
