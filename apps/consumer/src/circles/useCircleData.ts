import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { circleRequest } from './circlesApi';
export function useCircleData<T>(path: string) {
  const { status, user, getIdToken } = useAuthStatus();
  const key = `${status}:${user?.uid ?? ''}:${path}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: boolean;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setState(null);
      void (async () => {
        try {
          const token =
            status === 'authenticated' ? await getIdToken() : undefined;
          if (status === 'authenticated' && !token)
            throw new Error('No session');
          const data = await circleRequest<T>(path, token);
          if (active) setState({ key, data, error: false });
        } catch {
          if (active) setState({ key, data: null, error: true });
        }
      })();
      return () => {
        active = false;
      };
    }, [key, path, status, getIdToken, attempt]),
  );
  return {
    data: state?.key === key ? state.data : null,
    error: state?.key === key && state.error,
    reload: () => setAttempt((x) => x + 1),
  };
}
