import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { nearbyEvents, type NearbyPage } from './discoveryApi';
import {
  locate,
  permission,
  requestPermission,
  watchPermission,
  LocationFailure,
} from './location';

type Result = {
  status: 'idle' | 'loading' | 'unavailable' | 'error' | 'ready';
  data: NearbyPage | null;
};
type LocationContext = {
  enabled: boolean;
  requesting: boolean;
  declined: boolean;
  result: Result;
  enable: () => Promise<void>;
  disable: () => void;
  enterHome: () => void;
  leaveHome: () => void;
  refresh: () => Promise<void>;
};
const Context = createContext<LocationContext | null>(null);
const empty: Result = { status: 'idle', data: null };
/** Consent is memory-only for this trusted sign-in session. An account switch remounts the entire boundary. */
export function EventLocationProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuthStatus();
  const identity = status === 'authenticated' ? user?.uid : null;
  return (
    <EventLocationSession key={identity ?? 'guest'} active={Boolean(identity)}>
      {children}
    </EventLocationSession>
  );
}
export function EventLocationSession({
  children,
  active,
}: PropsWithChildren<{ active: boolean }>) {
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [result, setResult] = useState<Result>(empty);
  const enabledRef = useRef(false),
    home = useRef(false),
    foreground = useRef(AppState.currentState !== 'background');
  const alive = useRef(true),
    consentEpoch = useRef(0),
    requestEpoch = useRef(0);
  const request = useRef<AbortController | null>(null);
  const clear = useCallback(() => {
    requestEpoch.current++;
    request.current?.abort();
    request.current = null;
    if (alive.current) setResult(empty);
  }, []);
  const disable = useCallback(() => {
    consentEpoch.current++;
    enabledRef.current = false;
    clear();
    if (alive.current) {
      setEnabled(false);
      setRequesting(false);
    }
  }, [clear]);
  const refresh = useCallback(async () => {
    clear();
    if (
      !active ||
      !enabledRef.current ||
      !home.current ||
      !foreground.current ||
      !alive.current
    )
      return;
    const controller = new AbortController();
    request.current = controller;
    const version = requestEpoch.current;
    const current = () =>
      alive.current &&
      enabledRef.current &&
      home.current &&
      foreground.current &&
      version === requestEpoch.current &&
      !controller.signal.aborted;
    setResult({ status: 'loading', data: null });
    const timeout = setTimeout(() => {
      if (current()) {
        setResult({ status: 'unavailable', data: null });
        controller.abort();
      }
    }, 15000);
    try {
      const state = await permission();
      if (!current()) return;
      if (state === 'denied' || state === 'prompt') {
        setDeclined(true);
        disable();
        return;
      }
      if (state !== 'granted') throw new LocationFailure('unavailable');
      const point = await locate(controller.signal);
      if (!current()) return;
      clearTimeout(timeout);
      const networkTimeout = setTimeout(() => {
        if (current()) {
          setResult({ status: 'error', data: null });
          controller.abort();
        }
      }, 20000);
      try {
        const data = await nearbyEvents(point, controller.signal);
        if (current()) setResult({ status: 'ready', data });
      } catch {
        if (current()) setResult({ status: 'error', data: null });
      } finally {
        clearTimeout(networkTimeout);
      }
    } catch (error) {
      if (current()) {
        if (error instanceof LocationFailure && error.reason === 'denied') {
          setDeclined(true);
          disable();
        } else setResult({ status: 'unavailable', data: null });
      }
    } finally {
      clearTimeout(timeout);
    }
  }, [active, clear, disable]);
  const enable = useCallback(async () => {
    if (!active || !alive.current) return;
    clear();
    const version = ++consentEpoch.current;
    setRequesting(true);
    setDeclined(false);
    const state = await requestPermission();
    if (!alive.current || version !== consentEpoch.current) return;
    setRequesting(false);
    if (state === 'denied' || state === 'prompt') {
      setDeclined(true);
      disable();
      return;
    }
    enabledRef.current = true;
    setEnabled(true);
    if (home.current && foreground.current) await refresh();
  }, [active, clear, disable, refresh]);
  const enterHome = useCallback(() => {
    home.current = true;
    void refresh();
  }, [refresh]);
  const leaveHome = useCallback(() => {
    home.current = false;
    clear();
  }, [clear]);
  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
      if (!foreground.current) clear();
      else if (enabledRef.current) {
        void permission().then((state) => {
          if (!alive.current) return;
          if (state === 'denied' || state === 'prompt') {
            setDeclined(true);
            disable();
          } else if (home.current) void refresh();
        });
      }
    });
    const stop = watchPermission((state) => {
      if (enabledRef.current && (state === 'denied' || state === 'prompt')) {
        setDeclined(true);
        disable();
      }
    });
    return () => {
      alive.current = false;
      consentEpoch.current++;
      clear();
      stop();
      subscription.remove();
    };
  }, [clear, disable, refresh]);
  const value = useMemo(
    () => ({
      enabled,
      requesting,
      declined,
      result,
      enable,
      disable,
      enterHome,
      leaveHome,
      refresh,
    }),
    [
      enabled,
      requesting,
      declined,
      result,
      enable,
      disable,
      enterHome,
      leaveHome,
      refresh,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useEventLocation(): LocationContext {
  const context = useContext(Context);
  if (!context) throw new Error('EventLocationProvider required');
  return context;
}
