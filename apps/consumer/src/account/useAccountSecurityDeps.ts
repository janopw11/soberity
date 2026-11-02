import { useAuthStatus } from '../auth/AuthStatusContext';
import { profileApi } from '../profile/profileApi';
import type { AccountSecurityDeps } from './accountSecurity';

/** Null while no user is signed in; every sensitive action needs a uid. */
export function useAccountSecurityDeps(): AccountSecurityDeps | null {
  const { user, getIdToken, accountActions } = useAuthStatus();
  const uid = user?.uid ?? null;
  if (!uid) return null;
  return {
    uid,
    getToken: getIdToken,
    reauthenticate: accountActions.reauthenticate,
    updatePassword: accountActions.updatePassword,
    deleteUser: accountActions.deleteUser,
    deleteBackendData: (token) => profileApi.deleteData(token),
  };
}
