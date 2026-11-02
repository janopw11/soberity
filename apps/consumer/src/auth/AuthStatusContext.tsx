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

import {
  firebaseAuthAdapter,
  type AuthAdapter,
  type AuthUser,
} from './authAdapter';
import { fetchBackendIdentity } from './identityApi';

/**
 * `loading` exists only until the first auth event. `authenticated` is set
 * solely after the backend accepts the Firebase ID token (HTTP 200); the
 * client's own `emailVerified` flag is never trusted. `offline` keeps the
 * Firebase user but means the backend could not confirm the session.
 */
export type AuthStatus =
  'loading' | 'guest' | 'verification-pending' | 'authenticated' | 'offline';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
};

type AuthStatusContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
  applyEmailVerificationAction: (oobCode: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  checkPasswordResetCode: (oobCode: string) => Promise<string>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-checks the current session with the backend (used after `offline`). */
  retry: () => Promise<void>;
};

const AuthStatusContext = createContext<AuthStatusContextValue | null>(null);

type AuthStatusProviderProps = PropsWithChildren<{ adapter?: AuthAdapter }>;

export function AuthStatusProvider({
  children,
  adapter = firebaseAuthAdapter,
}: AuthStatusProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });
  const latestUser = useRef<AuthUser | null>(null);
  // Incremented on every session change so stale backend responses are ignored.
  const sequence = useRef(0);

  const resolveSession = useCallback(
    async (user: AuthUser | null, forceTokenRefresh = false) => {
      const current = ++sequence.current;
      const isCurrent = () => current === sequence.current;
      latestUser.current = user;

      if (!user) {
        setState({ status: 'guest', user: null });
        return;
      }

      setState((previous) => ({ ...previous, user }));

      try {
        const token = await adapter.getIdToken(forceTokenRefresh);
        if (!isCurrent()) return;
        if (!token) {
          setState({ status: 'guest', user: null });
          return;
        }

        const result = await fetchBackendIdentity(token);
        if (!isCurrent()) return;

        if (result === 'verified') {
          setState({ status: 'authenticated', user });
        } else if (result === 'unverified') {
          setState({ status: 'verification-pending', user });
        } else {
          // The backend rejected the token, so the local Firebase session is not trusted.
          await adapter.signOut();
          if (isCurrent()) setState({ status: 'guest', user: null });
        }
      } catch {
        if (isCurrent()) setState({ status: 'offline', user });
      }
    },
    [adapter],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = adapter.subscribe((user) => {
        void resolveSession(user);
      });
    } catch {
      // Firebase is not configured for this build; the app stays usable as a guest.
      setState({ status: 'guest', user: null });
    }

    return () => {
      sequence.current++;
      unsubscribe?.();
    };
  }, [adapter, resolveSession]);

  const signIn = useCallback(
    (email: string, password: string) => adapter.signIn(email, password),
    [adapter],
  );
  const signUp = useCallback(
    (email: string, password: string) => adapter.signUp(email, password),
    [adapter],
  );
  const resendVerificationEmail = useCallback(
    () => adapter.sendEmailVerification(),
    [adapter],
  );
  const refreshVerificationStatus = useCallback(async () => {
    await adapter.reload();
    await resolveSession(latestUser.current, true);
  }, [adapter, resolveSession]);
  const applyEmailVerificationAction = useCallback(
    (oobCode: string) => adapter.applyEmailVerificationAction(oobCode),
    [adapter],
  );
  const requestPasswordReset = useCallback(
    (email: string) => adapter.requestPasswordReset(email),
    [adapter],
  );
  const checkPasswordResetCode = useCallback(
    (oobCode: string) => adapter.checkPasswordResetCode(oobCode),
    [adapter],
  );
  const confirmPasswordReset = useCallback(
    (oobCode: string, newPassword: string) =>
      adapter.confirmPasswordReset(oobCode, newPassword),
    [adapter],
  );
  // Clears the session locally at once, so no private state outlives logout
  // and late backend responses from the previous session are ignored.
  const signOut = useCallback(async () => {
    sequence.current++;
    try {
      await adapter.signOut();
    } finally {
      latestUser.current = null;
      setState({ status: 'guest', user: null });
    }
  }, [adapter]);
  const retry = useCallback(
    () => resolveSession(latestUser.current),
    [resolveSession],
  );

  const value = useMemo<AuthStatusContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      resendVerificationEmail,
      refreshVerificationStatus,
      applyEmailVerificationAction,
      requestPasswordReset,
      checkPasswordResetCode,
      confirmPasswordReset,
      signOut,
      retry,
    }),
    [
      state,
      signIn,
      signUp,
      resendVerificationEmail,
      refreshVerificationStatus,
      applyEmailVerificationAction,
      requestPasswordReset,
      checkPasswordResetCode,
      confirmPasswordReset,
      signOut,
      retry,
    ],
  );

  return (
    <AuthStatusContext.Provider value={value}>
      {children}
    </AuthStatusContext.Provider>
  );
}

export function useAuthStatus(): AuthStatusContextValue {
  const value = useContext(AuthStatusContext);
  if (!value) {
    throw new Error('useAuthStatus must be used within an AuthStatusProvider');
  }
  return value;
}
