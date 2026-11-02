import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { render } from '../test-utils';
import { profileApi } from './profileApi';
import { useAccountLanguageSync } from './useAccountLanguage';

const mockAuthState = {
  status: 'authenticated' as const,
  user: { uid: 'uid-1', email: 'me@example.com', displayName: null },
  getIdToken: async () => 'token',
};

jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => mockAuthState,
}));

jest.mock('./profileApi', () => ({
  profileApi: {
    provision: jest.fn(async () => ({
      id: 'profile-1',
      displayName: null,
      city: null,
      interests: [],
      locale: 'en',
      updatedAt: '',
    })),
    update: jest.fn(async () => ({
      id: 'profile-1',
      displayName: null,
      city: null,
      interests: [],
      locale: 'pl',
      updatedAt: '',
    })),
  },
}));

function LanguageHarness() {
  useAccountLanguageSync();
  const { applyLanguage, language } = useThemePreferences();
  return (
    <>
      <Text>{`language:${language}`}</Text>
      <Pressable onPress={() => void applyLanguage('pl')} testID="switch-pl">
        <Text>switch</Text>
      </Pressable>
    </>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useAccountLanguageSync', () => {
  beforeEach(() => {
    jest.mocked(profileApi.provision).mockClear();
  });

  it('keeps the language chosen in the UI and does not re-sync after changing it', async () => {
    render(<LanguageHarness />);
    await waitFor(() =>
      expect(jest.mocked(profileApi.provision).mock.calls.length).toBe(1),
    );

    fireEvent.press(screen.getByTestId('switch-pl'));
    await waitFor(() => expect(screen.getByText('language:pl')).toBeTruthy());

    await act(async () => {
      await wait(100);
    });
    expect(screen.getByText('language:pl')).toBeTruthy();
    expect(jest.mocked(profileApi.provision).mock.calls.length).toBe(1);
  });
});
