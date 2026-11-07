import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import EventsScreen from './EventsScreen';

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock'),
);

const mockGet =
  jest.fn<(path: string, signal?: AbortSignal) => Promise<unknown>>();
jest.mock('./eventsApi', () => ({
  ...jest.requireActual<typeof import('./eventsApi')>('./eventsApi'),
  eventsGet: (path: string, signal: AbortSignal) => mockGet(path, signal),
}));
jest.mock('./EventLocationContext', () => {
  const enterEvents = () => {};
  const leaveEvents = () => {};
  return {
    useEventLocation: () => ({
      enabled: false,
      currentLocation: null,
      enterEvents,
      leaveEvents,
    }),
  };
});
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Link: ({ children }: { children: React.ReactNode }) => children,
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(effect, [effect]),
  };
});
jest.mock('./EventCard', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    EventCard: ({ event }: { event: { title: string } }) =>
      React.createElement(Text, null, event.title),
  };
});

const open = async () =>
  fireEvent.press(screen.getByTestId('events-open-filters'));
const show = async () =>
  fireEvent.press(screen.getByRole('button', { name: 'Show Events' }));
const query = () => new URLSearchParams(mockGet.mock.calls.at(-1)![0].slice(1));

describe('Sober Events draft/applied filters', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (path) => {
      const params = new URLSearchParams(path.slice(1));
      return {
        items: params.has('q')
          ? [{ id: 'fixture', title: 'Vienna Sober Rave' }]
          : [],
        page: Number(params.get('page')),
        size: 12,
        total: params.has('q') ? 25 : 0,
      };
    });
  });
  it('loads once, applies only on Show Events and avoids an unchanged duplicate request', async () => {
    await render(<EventsScreen />);
    await waitFor(() =>
      expect(screen.getByText('No events found')).toBeTruthy(),
    );
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(query().get('dateScope')).toBe('UPCOMING');
    await open();
    await fireEvent.changeText(screen.getByLabelText('Event name'), '  RaVe  ');
    expect(mockGet).toHaveBeenCalledTimes(1);
    await show();
    await waitFor(() =>
      expect(screen.getByText('Vienna Sober Rave')).toBeTruthy(),
    );
    expect(query().get('q')).toBe('RaVe');
    expect(mockGet).toHaveBeenCalledTimes(2);
    await open();
    expect(screen.getByLabelText('Event name').props.value).toBe('RaVe');
    await show();
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
  it('keeps filters across pages, cancels edits, and resets only drafts until applied', async () => {
    await render(<EventsScreen />);
    await open();
    await fireEvent.changeText(screen.getByLabelText('Event name'), 'rave');
    await show();
    await waitFor(() =>
      expect(screen.getByText('Vienna Sober Rave')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(query().get('page')).toBe('1'));
    expect(query().get('q')).toBe('rave');
    expect(query().get('dateScope')).toBe('UPCOMING');
    await open();
    await fireEvent.changeText(
      screen.getByLabelText('Event name'),
      'unsubmitted',
    );
    await act(async () =>
      screen.getByTestId('events-filters-dialog').props.onAccessibilityEscape(),
    );
    await open();
    expect(screen.getByLabelText('Event name').props.value).toBe('rave');
    const requests = mockGet.mock.calls.length;
    await fireEvent.press(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Event name').props.value).toBe('');
    expect(mockGet).toHaveBeenCalledTimes(requests);
    await show();
    await waitFor(() =>
      expect(screen.getByText('No events found')).toBeTruthy(),
    );
    expect(query().get('page')).toBe('0');
    expect(query().has('q')).toBe(false);
    expect(query().get('dateScope')).toBe('UPCOMING');
  });
  it('applies chips immediately and synchronizes the advanced multi-select without losing name filters', async () => {
    await render(<EventsScreen />);
    await open();
    await fireEvent.changeText(screen.getByLabelText('Event name'), 'rave');
    await show();
    await waitFor(() =>
      expect(screen.getByText('Vienna Sober Rave')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Music' }));
    await waitFor(() =>
      expect(query().get('category')).toContain('SOBER_RAVE'),
    );
    expect(query().get('q')).toBe('rave');
    await open();
    await fireEvent.press(screen.getByRole('button', { name: /^Category:/ }));
    expect(
      screen.getByRole('checkbox', { name: 'Sober rave' }).props
        .accessibilityState.checked,
    ).toBe(true);
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Sober party' }),
    );
    await show();
    await waitFor(() =>
      expect(query().get('category')).not.toContain('SOBER_PARTY'),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'All Events' }));
    await waitFor(() => expect(query().has('category')).toBe(false));
    expect(query().get('q')).toBe('rave');
  });
  it('rejects an incomplete custom range without requesting results', async () => {
    await render(<EventsScreen />);
    await open();
    await fireEvent.press(screen.getByRole('button', { name: /^Dates:/ }));
    await fireEvent.press(
      screen.getByRole('radio', { name: 'Custom date range' }),
    );
    const requests = mockGet.mock.calls.length;
    await show();
    expect(
      screen.getByText(
        'Choose a valid date range, with the start on or before the end.',
      ),
    ).toBeTruthy();
    expect(mockGet).toHaveBeenCalledTimes(requests);
  });
  it('shows loading and ignores an aborted stale response after a chip change', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    mockGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    await render(<EventsScreen />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
    const originalSignal = mockGet.mock.calls[0]![1]!;
    await fireEvent.press(screen.getByRole('button', { name: 'Music' }));
    await waitFor(() =>
      expect(screen.getByText('No events found')).toBeTruthy(),
    );
    expect(originalSignal.aborted).toBe(true);
    await act(async () =>
      resolveFirst!({
        items: [{ id: 'stale', title: 'Stale event' }],
        page: 0,
        size: 12,
        total: 1,
      }),
    );
    expect(screen.queryByText('Stale event')).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
  it('handles API failures and explicit retry', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'));
    await render(<EventsScreen />);
    await waitFor(() =>
      expect(
        screen.getByText('We could not load events. Please try again.'),
      ).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() =>
      expect(screen.getByText('No events found')).toBeTruthy(),
    );
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
