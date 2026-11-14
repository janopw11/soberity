import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import { EventGoingButton } from './EventGoingButton';
import type { ParticipationState } from './eventInterestsApi';

const mockGet =
  jest.fn<(id: string, token?: string) => Promise<ParticipationState>>();
const mockSet =
  jest.fn<(id: string, token: string, declared: boolean) => Promise<void>>();
const mockToken = jest.fn<() => Promise<string | null>>();
const mockPush = jest.fn();
let mockAuth = { status: 'authenticated', user: { uid: 'alice' } };
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({ ...mockAuth, getIdToken: mockToken }),
}));
jest.mock('./eventInterestsApi', () => ({
  getParticipation: (id: string, token?: string) => mockGet(id, token),
  setEventInterest: (id: string, token: string, declared: boolean) =>
    mockSet(id, token, declared),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    router: { push: (path: string) => mockPush(path) },
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(effect, [effect]),
  };
});
const empty = { declared: false, participant_count: 4, can_join: true };
beforeEach(() => {
  mockAuth = { status: 'authenticated', user: { uid: 'alice' } };
  mockToken.mockReset().mockResolvedValue('alice-token');
  mockPush.mockReset();
  mockGet.mockReset().mockResolvedValue(empty);
  mockSet.mockReset().mockResolvedValue(undefined);
});
it('loads before allowing a write, then uses server counts for join and cancellation', async () => {
  let resolve!: (value: ParticipationState) => void;
  mockGet.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render(<EventGoingButton eventId="one" />);
  expect(screen.queryByTestId('event-going-button')).toBeNull();
  await act(async () => resolve(empty));
  mockGet.mockResolvedValue({ ...empty, declared: true, participant_count: 7 });
  await fireEvent.press(screen.getByTestId('event-going-button'));
  await waitFor(() => expect(screen.getByText('7 participants')).toBeTruthy());
  expect(mockSet).toHaveBeenCalledWith('one', 'alice-token', true);
  expect(screen.getByText('You’re going sober ✓')).toBeTruthy();
  mockGet.mockResolvedValue({ ...empty, participant_count: 6 });
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel RSVP' }));
  await waitFor(() => expect(screen.getByText('6 participants')).toBeTruthy());
  expect(mockSet).toHaveBeenLastCalledWith('one', 'alice-token', false);
});
it('does not offer a second toggle after an uncertain write until state is refreshed', async () => {
  await render(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(screen.getByTestId('event-going-button')).toBeTruthy(),
  );
  mockSet.mockRejectedValueOnce(new Error('timeout after commit'));
  await fireEvent.press(screen.getByTestId('event-going-button'));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Refresh participation' }),
    ).toBeTruthy(),
  );
  expect(screen.queryByTestId('event-going-button')).toBeNull();
  mockGet.mockResolvedValue({ ...empty, declared: true, participant_count: 5 });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Refresh participation' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Cancel RSVP' })).toBeTruthy(),
  );
  expect(mockSet).toHaveBeenCalledTimes(1);
});
it('ignores late reads from a previous account', async () => {
  let resolve!: (value: ParticipationState) => void;
  mockGet.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = await render(<EventGoingButton eventId="one" />);
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  mockAuth = { status: 'authenticated', user: { uid: 'bob' } };
  mockToken.mockResolvedValue('bob-token');
  await view.rerender(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Join Event' })).toBeTruthy(),
  );
  await act(async () => resolve({ ...empty, declared: true }));
  expect(screen.queryByText('You’re going sober ✓')).toBeNull();
});
it('guests see the count but must sign in without issuing a write', async () => {
  mockAuth = { status: 'guest', user: { uid: '' } };
  await render(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Sign in to join' }),
    ).toBeTruthy(),
  );
  await fireEvent.press(screen.getByTestId('event-going-button'));
  expect(mockPush).toHaveBeenCalledWith('/sign-in');
  expect(mockSet).not.toHaveBeenCalled();
  expect(mockToken).not.toHaveBeenCalled();
});
it('blocks joining a closed event but still allows cancelling an existing RSVP', async () => {
  mockGet.mockResolvedValue({ ...empty, can_join: false });
  const view = await render(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(screen.getByText('Registration has closed.')).toBeTruthy(),
  );
  expect(screen.queryByTestId('event-going-button')).toBeNull();
  mockGet.mockResolvedValue({ ...empty, can_join: false, declared: true });
  await view.rerender(<EventGoingButton eventId="two" />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Cancel RSVP' })).toBeTruthy(),
  );
});

it('ignores a completed write after the active account changes', async () => {
  let resolve!: () => void;
  mockSet.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const view = await render(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Join Event' })).toBeTruthy(),
  );
  await fireEvent.press(screen.getByTestId('event-going-button'));
  await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(1));
  mockAuth = { status: 'authenticated', user: { uid: 'bob' } };
  mockToken.mockResolvedValue('bob-token');
  await view.rerender(<EventGoingButton eventId="one" />);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Join Event' })).toBeTruthy(),
  );
  mockGet.mockResolvedValueOnce({
    ...empty,
    declared: true,
    participant_count: 5,
  });
  await act(async () => resolve());
  expect(screen.getByText('4 participants')).toBeTruthy();
  expect(screen.queryByText('You’re going sober ✓')).toBeNull();
});
