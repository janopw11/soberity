import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text } from 'react-native';
import { useEffect } from 'react';
import { render } from '../test-utils';
import {
  EventLocationProvider,
  EventLocationSession,
  useEventLocation,
} from './EventLocationContext';
import { LocationFailure } from './locationTypes';

const mockPermission = jest.fn<() => Promise<string>>();
const mockRequest = jest.fn<() => Promise<string>>();
const mockLocate =
  jest.fn<() => Promise<{ latitude: number; longitude: number }>>();
const mockNearby = jest.fn<() => Promise<unknown>>();
let mockUid = 'session-a';
let permissionChanged: ((state: string) => void) | undefined;
let foregroundChanged: ((state: string) => void) | undefined;
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({ status: 'authenticated', user: { uid: mockUid } }),
}));
jest.mock('./location', () => ({
  permission: () => mockPermission(),
  requestPermission: () => mockRequest(),
  locate: () => mockLocate(),
  LocationFailure:
    jest.requireActual<typeof import('./locationTypes')>('./locationTypes')
      .LocationFailure,
  watchPermission: (callback: (value: string) => void) => {
    permissionChanged = callback;
    return () => {
      permissionChanged = undefined;
    };
  },
}));
jest.mock('./discoveryApi', () => ({ nearbyEvents: () => mockNearby() }));
function Probe() {
  const context = useEventLocation();
  useEffect(() => {
    context.enterHome();
    return context.leaveHome;
  }, [context.enterHome, context.leaveHome]);
  return (
    <>
      <Button
        title="Enable"
        onPress={() => {
          void context.enable();
        }}
      />
      <Button title="Disable" onPress={context.disable} />
      <Button title="Leave" onPress={context.leaveHome} />
      <Button
        title="Refresh"
        onPress={() => {
          void context.refresh();
        }}
      />
      <Text testID="state">
        {context.enabled ? context.result.status : 'hidden'}
      </Text>
      <Text testID="results">
        {context.result.data?.items.map((value) => value.title).join(',') ?? ''}
      </Text>
    </>
  );
}
describe('foreground nearby consent boundary', () => {
  beforeEach(() => {
    mockUid = 'session-a';
    mockPermission.mockReset().mockResolvedValue('granted');
    mockRequest.mockReset().mockResolvedValue('granted');
    mockLocate
      .mockReset()
      .mockResolvedValue({ latitude: 48.2, longitude: 16.3 });
    mockNearby
      .mockReset()
      .mockResolvedValue({
        items: [{ title: 'Real API result' }],
        total: 1,
        page: 0,
        size: 3,
        radiusKm: 100,
      });
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, callback) => {
        foregroundChanged = callback as (state: string) => void;
        return { remove: () => undefined };
      });
  });
  it('does not request permission or position on Home without an explicit opt-in', async () => {
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockLocate).not.toHaveBeenCalled();
    expect(mockNearby).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('ready'),
    );
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockLocate).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByText('Disable'));
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(screen.getByTestId('results').props.children).toBe('');
  });
  it('ignores a late permission grant after the user turns the feature off', async () => {
    let resolve: ((value: string) => void) | undefined;
    mockRequest.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await fireEvent.press(screen.getByText('Disable'));
    await act(async () => {
      resolve?.('granted');
    });
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(mockNearby).not.toHaveBeenCalled();
  });
  it('keeps refusal hidden and does not send a nearby query', async () => {
    mockRequest.mockResolvedValue('denied');
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(mockNearby).not.toHaveBeenCalled();
  });
  it('ignores a late position after leaving Home and a late response after revocation', async () => {
    let finishPosition:
      ((value: { latitude: number; longitude: number }) => void) | undefined;
    mockLocate.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishPosition = resolve;
        }),
    );
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() => expect(mockLocate).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByText('Leave'));
    await act(async () => {
      finishPosition?.({ latitude: 1, longitude: 2 });
    });
    expect(mockNearby).not.toHaveBeenCalled();
  });
  it('cannot show an in-flight response after OS permission is revoked', async () => {
    let resolve: ((value: unknown) => void) | undefined;
    mockNearby.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() => expect(mockNearby).toHaveBeenCalledTimes(1));
    await act(async () => {
      permissionChanged?.('denied');
    });
    await act(async () => {
      resolve?.({
        items: [{ title: 'Stale result' }],
        total: 1,
        size: 3,
        page: 0,
        radiusKm: 100,
      });
    });
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(screen.getByTestId('results').props.children).toBe('');
  });
  it('does not transfer permission or results to a different authenticated account', async () => {
    const view = await render(
      <EventLocationProvider>
        <Probe />
      </EventLocationProvider>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('ready'),
    );
    mockUid = 'session-b';
    await view.rerender(
      <EventLocationProvider>
        <Probe />
      </EventLocationProvider>,
    );
    expect(screen.getByTestId('state').props.children).toBe('hidden');
    expect(screen.getByTestId('results').props.children).toBe('');
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
  it('distinguishes unavailable location, empty supply and network failure', async () => {
    mockLocate.mockRejectedValue(new LocationFailure('unavailable'));
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('unavailable'),
    );
    mockLocate.mockResolvedValue({ latitude: 1, longitude: 2 });
    mockNearby.mockRejectedValue(new Error('Network unavailable'));
    await fireEvent.press(screen.getByText('Refresh'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('error'),
    );
    mockNearby.mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      size: 3,
      radiusKm: 100,
    });
    await fireEvent.press(screen.getByText('Refresh'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('ready'),
    );
    expect(screen.getByTestId('results').props.children).toBe('');
  });
  it('clears on background and rechecks OS permission before any foreground query', async () => {
    await render(
      <EventLocationSession active>
        <Probe />
      </EventLocationSession>,
    );
    await fireEvent.press(screen.getByText('Enable'));
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('ready'),
    );
    await act(async () => {
      foregroundChanged?.('background');
    });
    expect(screen.getByTestId('results').props.children).toBe('');
    mockPermission.mockResolvedValue('denied');
    await act(async () => {
      foregroundChanged?.('active');
    });
    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('hidden'),
    );
    expect(mockNearby).toHaveBeenCalledTimes(1);
  });
});
