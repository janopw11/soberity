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
import { profileApi } from '../profile/profileApi';
import { useAuthStatus } from '../auth/AuthStatusContext';
import {
  nearbyEvents,
  type NearbyPage,
  type NearbyPlace,
} from './discoveryApi';
import {
  locate,
  permission,
  requestPermission,
  watchPermission,
  LocationFailure,
} from './location';
import { reverseLocation, type ReverseLocation } from './reverseGeocode';

type Result = {
  status: 'idle' | 'loading' | 'unavailable' | 'error' | 'ready';
  data: NearbyPage | null;
};
type LocationContext = {
  enabled: boolean;
  requesting: boolean;
  declined: boolean;
  saving: boolean;
  consentError: boolean;
  retryConsent: () => void;
  result: Result;
  currentLocation: {
    latitude: number;
    longitude: number;
    place: NearbyPlace | null;
    location: ReverseLocation | null;
  } | null;
  enable: () => Promise<void>;
  disable: () => void;
  enterHome: () => void;
  leaveHome: () => void;
  enterEvents: () => void;
  leaveEvents: () => void;
  refresh: () => Promise<void>;
};
const Context = createContext<LocationContext | null>(null);
const empty: Result = { status: 'idle', data: null };
/** Consent belongs to the account; position remains memory-only and account switches clear it. */
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
  const { getIdToken } = useAuthStatus();
  const [saving, setSaving] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const savingRef = useRef(false);
  const desiredConsent = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [result, setResult] = useState<Result>(empty);
  const [currentLocation, setCurrentLocation] =
    useState<LocationContext['currentLocation']>(null);
  const enabledRef = useRef(false),
    home = useRef(false),
    events = useRef(false),
    foreground = useRef(AppState.currentState !== 'background');
  const alive = useRef(true),
    consentEpoch = useRef(0),
    requestEpoch = useRef(0);
  const request = useRef<AbortController | null>(null);
  const clear = useCallback(() => {
    requestEpoch.current++;
    request.current?.abort();
    request.current = null;
    if (alive.current) {
      setResult(empty);
      setCurrentLocation(null);
    }
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
      (!home.current && !events.current) ||
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
      (home.current || events.current) &&
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
      const approximate = {
        latitude: Math.round(point.latitude * 100) / 100,
        longitude: Math.round(point.longitude * 100) / 100,
      };
      setCurrentLocation({ ...approximate, place: null, location: null });
      clearTimeout(timeout);
      const networkTimeout = setTimeout(() => {
        if (current()) {
          setResult({ status: 'error', data: null });
          controller.abort();
        }
      }, 10000);
      try {
        const locationRequest = reverseLocation(point, controller.signal);
        const [data, resolved] = await Promise.all([
          nearbyEvents(point, controller.signal),
          locationRequest,
        ]);
        if (current()) {
          setResult({ status: 'ready', data });
          setCurrentLocation({
            ...approximate,
            place: data.location ?? null,
            location: resolved,
          });
        }
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
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      const profile = await profileApi.update(token, {
        eventLocationConsent: true,
      });
      if (profile.eventLocationConsent !== true)
        throw new Error('Consent was not saved');
    } catch {
      if (alive.current && version === consentEpoch.current)
        setConsentError(true);
      return;
    }
    if (!alive.current || version !== consentEpoch.current) return;
    enabledRef.current = true;
    setEnabled(true);
    if ((home.current || events.current) && foreground.current) await refresh();
  }, [active, clear, disable, refresh, getIdToken]);
  const enterHome = useCallback(() => {
    home.current = true;
    void refresh();
  }, [refresh]);
  const leaveHome = useCallback(() => {
    home.current = false;
    if (!events.current) clear();
  }, [clear]);
  const enterEvents = useCallback(() => {
    events.current = true;
    void refresh();
  }, [refresh]);
  const leaveEvents = useCallback(() => {
    events.current = false;
    if (!home.current) clear();
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
          } else if (home.current || events.current) void refresh();
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
  const saveConsent = useCallback(
    async (allow: boolean) => {
      if (!active || savingRef.current) return;
      desiredConsent.current = allow;
      savingRef.current = true;
      setSaving(true);
      setConsentError(false);
      try {
        if (allow) {
          await enable();
        } else {
          disable();
          const token = await getIdToken();
          if (!token) throw new Error('Authentication required');
          const profile = await profileApi.update(token, {
            eventLocationConsent: false,
          });
          if (profile.eventLocationConsent !== false)
            throw new Error('Consent was not saved');
        }
      } catch {
        if (alive.current) setConsentError(true);
      } finally {
        savingRef.current = false;
        if (alive.current) setSaving(false);
      }
    },
    [active, enable, disable, getIdToken],
  );
  const retryConsent = useCallback(() => {
    void saveConsent(desiredConsent.current);
  }, [saveConsent]);
  const enableSaved = useCallback(() => saveConsent(true), [saveConsent]);
  const disableSaved = useCallback(() => {
    void saveConsent(false);
  }, [saveConsent]);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const version = consentEpoch.current;
    void (async () => {
      try {
        const token = await getIdToken();
        if (!token) throw new Error('Authentication required');
        const profile = await profileApi.provision(token, null);
        if (
          cancelled ||
          !alive.current ||
          version !== consentEpoch.current ||
          savingRef.current
        )
          return;
        enabledRef.current = profile.eventLocationConsent === true;
        setEnabled(enabledRef.current);
        if (enabledRef.current && (home.current || events.current))
          void refresh();
      } catch {
        if (!cancelled && alive.current) setConsentError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, getIdToken, refresh]);
  const value = useMemo(
    () => ({
      enabled,
      requesting,
      declined,
      saving,
      consentError,
      retryConsent,
      result,
      currentLocation,
      enable: enableSaved,
      disable: disableSaved,
      enterHome,
      leaveHome,
      enterEvents,
      leaveEvents,
      refresh,
    }),
    [
      enabled,
      requesting,
      declined,
      saving,
      consentError,
      retryConsent,
      result,
      currentLocation,
      enableSaved,
      disableSaved,
      enterHome,
      leaveHome,
      enterEvents,
      leaveEvents,
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
