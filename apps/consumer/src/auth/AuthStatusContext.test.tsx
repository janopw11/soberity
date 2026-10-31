import { act, renderHook } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { AuthStatusProvider, useAuthStatus } from './AuthStatusContext';

describe('AuthStatusContext', () => {
  it('defaults to the guest status', async () => {
    const { result } = await renderHook(() => useAuthStatus(), {
      wrapper: AuthStatusProvider,
    });

    expect(result.current.status).toBe('guest');
  });

  it('transitions between guest, verification-pending and authenticated', async () => {
    const { result } = await renderHook(() => useAuthStatus(), {
      wrapper: AuthStatusProvider,
    });

    await act(() => result.current.setStatus('verification-pending'));
    expect(result.current.status).toBe('verification-pending');

    await act(() => result.current.setStatus('authenticated'));
    expect(result.current.status).toBe('authenticated');

    await act(() => result.current.setStatus('guest'));
    expect(result.current.status).toBe('guest');
  });

  it('throws when used outside of its provider', async () => {
    await expect(renderHook(() => useAuthStatus())).rejects.toThrow(
      'useAuthStatus must be used within an AuthStatusProvider',
    );
  });
});
