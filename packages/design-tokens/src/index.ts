/**
 * Soberity design tokens — single source of truth for color, type, spacing
 * and radius values, per `docs/BRANDING.md` (plum-soft and violet themes).
 * Consumed by apps/consumer (and later by other clients) instead of
 * hardcoded hex/pixel values.
 */

/** Brand primitives (docs/BRANDING.md §3.1). Not all are text-safe; see colors.* */
export const brand = {
  offWhite: '#FAF9FD',
  lavender: '#EDE7F6',
  lilac: '#DCCFF5',
  mutedViolet: '#A78BFA',
  deepPurple: '#6D3CC3',
  stone: '#E6E2EA',
  slate: '#6B7280',
} as const;

/** Semantic color tokens — light theme (violet). */
const lightColors = {
  background: '#FAF9FD',
  backdrop: 'rgba(36, 33, 54, 0.4)',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE7F6',
  textPrimary: '#242136',
  textSecondary: '#4B425D',
  textMuted: '#5D6470',
  primary: '#6D3CC3',
  primaryPressed: '#5B2AA8',
  onPrimary: '#FFFFFF',
  border: '#D9D0E6',
  focusRing: '#5B2AA8',
  success: '#176B48',
  warning: '#865500',
  danger: '#B42318',
  onDanger: '#FFFFFF',
  info: '#2256A5',
} as const;

/** Semantic color tokens — dark theme (plum-soft). */
const darkColors = {
  background: '#2B2339',
  backdrop: 'rgba(20, 17, 28, 0.72)',
  surface: '#342A44',
  surfaceAlt: '#3E3350',
  textPrimary: '#F1ECF8',
  textSecondary: '#D0C2E0',
  textMuted: '#B9A7CB',
  primary: '#C1A4F6',
  primaryPressed: '#D8C0FF',
  onPrimary: '#14111C',
  border: '#5B4A6C',
  focusRing: '#D8C0FF',
  success: '#79D6A5',
  warning: '#F2C66D',
  danger: '#FF8A8A',
  onDanger: '#331B21',
  info: '#9BC4FF',
} as const;

export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

export type ColorScheme = keyof typeof themes;
export type Colors = (typeof themes)[ColorScheme];

/** Backwards-compatible light palette; apps should use the active theme context. */
export const colors = lightColors;

/** 4-pt base spacing scale (docs/BRANDING.md §5). */
export const spacing = {
  space4: 4,
  space8: 8,
  space12: 12,
  space16: 16,
  space24: 24,
  space32: 32,
  space40: 40,
  space48: 48,
  space64: 64,
} as const;

/** Corner radii (docs/BRANDING.md §5). */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '600' | '700';
};

/** Typographic scale (docs/BRANDING.md §4). */
export const typography = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
  h1: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyleToken>;

/** Minimum interactive touch target size (docs/BRANDING.md §3.3). */
export const minTouchTarget = {
  ios: 44,
  android: 48,
  default: 48,
} as const;

export type Brand = typeof brand;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
