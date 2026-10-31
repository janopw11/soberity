import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

/**
 * Three-way auth contract that the navigation guard (app/_layout.tsx) is
 * built against. `guest` is the only reachable status today: real sign-in,
 * session persistence and Firebase ID token verification are implemented in
 * P0-I05/P0-I06, and email verification wiring lands in P0-I07. Until then,
 * `setStatus` is a local-only stub with no network or persistence effects.
 */
export type AuthStatus = 'guest' | 'verification-pending' | 'authenticated';

export const INITIAL_AUTH_STATUS: AuthStatus = 'guest';

type AuthStatusContextValue = {
  status: AuthStatus;
  setStatus: (status: AuthStatus) => void;
};

const AuthStatusContext = createContext<AuthStatusContextValue | null>(null);

export function AuthStatusProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(INITIAL_AUTH_STATUS);
  const value = useMemo<AuthStatusContextValue>(
    () => ({ status, setStatus }),
    [status],
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
