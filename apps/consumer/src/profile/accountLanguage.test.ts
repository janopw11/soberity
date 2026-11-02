import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SupportedLanguage } from '../i18n';
import { readAccountLocale, writeAccountLocale } from './accountLocale';
import { setAccountLanguage, syncAccountLanguage } from './accountLanguage';
import { profileApi } from './profileApi';

jest.mock('./profileApi', () => ({
  profileApi: {
    provision: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
  },
}));

const provision = jest.mocked(profileApi.provision);
const update = jest.mocked(profileApi.update);

type ApplyLanguage = (language: SupportedLanguage) => Promise<void>;

const profileWith = (locale: SupportedLanguage | null) => ({
  id: 'profile-1',
  displayName: null,
  city: null,
  interests: [],
  locale,
  updatedAt: '2026-11-02T10:00:00Z',
});

function newApply() {
  return jest.fn<ApplyLanguage>(async () => undefined);
}

function deps(uid: string, applyLanguage: ApplyLanguage = newApply()) {
  return {
    uid,
    getToken: jest.fn(async () => `token-${uid}`),
    applyLanguage,
  };
}

describe('account language', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    provision.mockReset();
    update.mockReset();
  });

  it('never reports a language as saved when the backend does not confirm it', async () => {
    update.mockRejectedValue(new Error('offline'));
    const applyLanguage = newApply();

    const result = await setAccountLanguage(deps('uid-a', applyLanguage), 'pl');

    expect(result).toEqual({ saved: false });
    expect(applyLanguage).toHaveBeenCalledWith('pl');
    expect(await readAccountLocale('uid-a')).toEqual({
      locale: 'pl',
      pending: true,
    });
  });

  it('clears the pending flag once the backend confirms the change', async () => {
    update.mockResolvedValue(profileWith('pl'));

    const result = await setAccountLanguage(deps('uid-a'), 'pl');

    expect(result).toEqual({ saved: true });
    expect(await readAccountLocale('uid-a')).toEqual({
      locale: 'pl',
      pending: false,
    });
  });

  it('sends a pending change only for the account that made it', async () => {
    await writeAccountLocale('uid-a', { locale: 'pl', pending: true });
    provision.mockResolvedValue(profileWith(null));

    // Another account signs in on the same device.
    await syncAccountLanguage({ ...deps('uid-b'), guestLanguage: null });

    expect(update).not.toHaveBeenCalled();
    expect(await readAccountLocale('uid-a')).toEqual({
      locale: 'pl',
      pending: true,
    });
  });

  it('flushes the pending change of the same account before applying the profile', async () => {
    await writeAccountLocale('uid-a', { locale: 'pl', pending: true });
    update.mockResolvedValue(profileWith('pl'));
    provision.mockResolvedValue(profileWith('pl'));
    const applyLanguage = newApply();

    await syncAccountLanguage({
      ...deps('uid-a', applyLanguage),
      guestLanguage: 'en',
    });

    expect(update).toHaveBeenCalledWith('token-uid-a', { locale: 'pl' });
    expect(applyLanguage).toHaveBeenCalledWith('pl');
    expect(await readAccountLocale('uid-a')).toEqual({
      locale: 'pl',
      pending: false,
    });
  });

  it('prefers the account language over the guest choice', async () => {
    provision.mockResolvedValue(profileWith('en'));
    const applyLanguage = newApply();

    const applied = await syncAccountLanguage({
      ...deps('uid-a', applyLanguage),
      guestLanguage: 'pl',
    });

    expect(provision).toHaveBeenCalledWith('token-uid-a', 'pl');
    expect(applied).toBe('en');
    expect(applyLanguage).toHaveBeenCalledWith('en');
  });

  it('keeps the current language when the account has no preference', async () => {
    provision.mockResolvedValue(profileWith(null));
    const applyLanguage = newApply();

    const applied = await syncAccountLanguage({
      ...deps('uid-a', applyLanguage),
      guestLanguage: null,
    });

    expect(applied).toBeNull();
    expect(applyLanguage).not.toHaveBeenCalled();
    expect(await readAccountLocale('uid-a')).toBeNull();
  });

  it('falls back to the last known account language when the backend is unreachable', async () => {
    await writeAccountLocale('uid-a', { locale: 'pl', pending: false });
    provision.mockRejectedValue(new Error('offline'));
    const applyLanguage = newApply();

    const applied = await syncAccountLanguage({
      ...deps('uid-a', applyLanguage),
      guestLanguage: null,
    });

    expect(applied).toBe('pl');
    expect(applyLanguage).toHaveBeenCalledWith('pl');
  });
});
