import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as native from './location';
import * as web from './location.web';
const mockCheck =
  jest.fn<() => Promise<{ granted: boolean; status: string }>>();
const mockAsk = jest.fn<() => Promise<{ granted: boolean }>>();
const mockServices = jest.fn<() => Promise<boolean>>();
const mockPosition =
  jest.fn<() => Promise<{ coords: { latitude: number; longitude: number } }>>();
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: () => mockCheck(),
  requestForegroundPermissionsAsync: () => mockAsk(),
  hasServicesEnabledAsync: () => mockServices(),
  getCurrentPositionAsync: () => mockPosition(),
}));
const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  'navigator',
);
let browserState: PermissionState;
const mockBrowserPosition =
  jest.fn<
    (success: PositionCallback, failure?: PositionErrorCallback | null) => void
  >();
beforeEach(() => {
  mockCheck.mockReset().mockResolvedValue({ granted: true, status: 'granted' });
  mockAsk.mockReset().mockResolvedValue({ granted: true });
  mockServices.mockReset().mockResolvedValue(true);
  mockPosition
    .mockReset()
    .mockResolvedValue({ coords: { latitude: 48.2, longitude: 16.3 } });
  browserState = 'granted';
  mockBrowserPosition.mockReset();
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      permissions: { query: async () => ({ state: browserState }) },
      geolocation: { getCurrentPosition: mockBrowserPosition },
    },
  });
});
afterEach(() => {
  if (originalNavigator)
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
});
describe('native foreground adapter', () => {
  it('checks without prompting and obtains one current point only after a grant', async () => {
    expect(await native.locate(new AbortController().signal)).toEqual({
      latitude: 48.2,
      longitude: 16.3,
    });
    expect(mockPosition).toHaveBeenCalledTimes(1);
    expect(mockAsk).not.toHaveBeenCalled();
    expect(await native.requestPermission()).toBe('granted');
    expect(mockAsk).toHaveBeenCalledTimes(1);
  });
  it('refuses a new system prompt on automatic lookup and handles disabled services', async () => {
    mockCheck.mockResolvedValue({ granted: false, status: 'undetermined' });
    await expect(
      native.locate(new AbortController().signal),
    ).rejects.toMatchObject({ reason: 'denied' });
    expect(mockAsk).not.toHaveBeenCalled();
    expect(mockPosition).not.toHaveBeenCalled();
    mockCheck.mockResolvedValue({ granted: true, status: 'granted' });
    mockServices.mockResolvedValue(false);
    await expect(
      native.locate(new AbortController().signal),
    ).rejects.toMatchObject({ reason: 'unavailable' });
  });
});
describe('browser foreground adapter', () => {
  it('preserves explicit refusal even when the Permissions API cannot report it', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition: (
            _success: PositionCallback,
            failure: PositionErrorCallback,
          ) => failure({ code: 1 } as GeolocationPositionError),
        },
      },
    });
    expect(await web.requestPermission()).toBe('denied');
  });
  it('does not trigger geolocation on an ungranted Home visit', async () => {
    browserState = 'prompt';
    await expect(
      web.locate(new AbortController().signal),
    ).rejects.toMatchObject({ reason: 'denied' });
    expect(mockBrowserPosition).not.toHaveBeenCalled();
  });
  it('distinguishes timeout from denial and handles missing geolocation support', async () => {
    mockBrowserPosition.mockImplementation((_success, failure) =>
      failure?.({ code: 3 } as GeolocationPositionError),
    );
    await expect(
      web.locate(new AbortController().signal),
    ).rejects.toMatchObject({ reason: 'unavailable' });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });
    expect(await web.permission()).toBe('unavailable');
    expect(await web.requestPermission()).toBe('unavailable');
  });
});
