import { describe, expect, it } from '@jest/globals';

import en from './resources/en.json';
import pl from './resources/pl.json';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  resolveDeviceLanguage,
} from './index';

function collectKeyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nested]) =>
      collectKeyPaths(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n resources', () => {
  it('have the same key structure in en and pl (no missing translations)', () => {
    expect(collectKeyPaths(pl).sort()).toEqual(collectKeyPaths(en).sort());
  });

  it('expose en as the default and only fallback language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('pl');
  });

  it('falls back to en for unsupported or missing device locales', () => {
    expect(resolveDeviceLanguage()).toEqual(expect.stringMatching(/^(en|pl)$/));
  });
});
