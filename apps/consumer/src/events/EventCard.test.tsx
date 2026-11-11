import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { EventCard } from './EventCard';
import type { DiscoveryEvent } from './eventsApi';

const mockToken = jest.fn<() => Promise<string | null>>();
const mockInterest = jest.fn<() => Promise<boolean>>();
let mockAuth = { status: 'authenticated', user: { uid: 'alice' } };
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({ ...mockAuth, getIdToken: mockToken }),
}));
jest.mock('./eventInterestsApi', () => ({
  getEventInterest: () => mockInterest(),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]) };
});
jest.mock('./EventTicket', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { EventTicket: ({ going }: { going: boolean }) => React.createElement(Text, null, going ? 'Going Sober ✓' : 'No badge') };
});
const event = { id: 'event-1' } as DiscoveryEvent;
beforeEach(() => {
  mockAuth = { status: 'authenticated', user: { uid: 'alice' } };
  mockToken.mockReset().mockResolvedValue('token');
  mockInterest.mockReset().mockResolvedValue(true);
});
it('shows a confirmed declaration and clears it on sign out without fetching for guests', async () => {
  const view = await render(<EventCard event={event} />);
  await waitFor(() => expect(screen.getByText('Going Sober ✓')).toBeTruthy());
  mockAuth = { status: 'guest', user: { uid: '' } };
  await view.rerender(<EventCard event={event} />);
  expect(screen.getByText('No badge')).toBeTruthy();
  expect(mockInterest).toHaveBeenCalledTimes(1);
});
it('ignores a late response belonging to the previous account', async () => {
  let resolve!: (value: boolean) => void;
  mockInterest.mockImplementationOnce(() => new Promise<boolean>((done) => { resolve = done; }));
  const view = await render(<EventCard event={event} />);
  await waitFor(() => expect(mockInterest).toHaveBeenCalledTimes(1));
  mockAuth = { status: 'authenticated', user: { uid: 'bob' } };
  mockInterest.mockResolvedValue(false);
  await view.rerender(<EventCard event={event} />);
  await waitFor(() => expect(mockInterest).toHaveBeenCalledTimes(2));
  await act(async () => resolve(true));
  expect(screen.getByText('No badge')).toBeTruthy();
});
it('does not claim a declaration when the request fails', async () => {
  mockInterest.mockRejectedValue(new Error('Offline'));
  await render(<EventCard event={event} />);
  await waitFor(() => expect(mockInterest).toHaveBeenCalledTimes(1));
  expect(screen.getByText('No badge')).toBeTruthy();
});
