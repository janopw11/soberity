import { describe, expect, it } from '@jest/globals';

import { themes } from '@soberity/design-tokens';

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  const [red, green, blue] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Invalid color token: ${hex}`);
  }
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  const [lighter, darker] = values;
  if (lighter === undefined || darker === undefined) {
    throw new Error('A contrast comparison requires two colors.');
  }
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme tokens', () => {
  it.each(Object.entries(themes))(
    '%s provides accessible text, status, focus and button contrast',
    (_name, palette) => {
      for (const token of [
        'textPrimary',
        'textSecondary',
        'textMuted',
        'primary',
        'success',
        'warning',
        'danger',
        'info',
      ] as const) {
        expect(
          contrast(palette[token], palette.surfaceAlt),
        ).toBeGreaterThanOrEqual(4.5);
      }

      expect(
        contrast(palette.focusRing, palette.background),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(palette.primary, palette.onPrimary),
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.danger, palette.onDanger)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );
});
