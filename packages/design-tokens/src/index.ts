/**
 * Soberity design tokens — single source of truth for color, type, spacing
 * and radius values, per `docs/BRANDING.md` (ocean dark and light themes).
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

/** Semantic color tokens — light theme (ocean). */
const lightColors = {
  background: '#FFFFFF',
  backdrop: 'rgba(2, 19, 34, 0.4)',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF6FC',
  chapterSurface: '#F3F5F7',
  eventImageScrim: 'rgba(2, 13, 31, 0.72)',
  eventImageText: '#FFFFFF',
  textPrimary: '#08243A',
  textSecondary: '#35566C',
  textMuted: '#4E6878',
  primary: '#006C9C',
  primaryPressed: '#00547D',
  onPrimary: '#FFFFFF',
  border: '#7C9FB3',
  focusRing: '#00547D',
  success: '#176B48',
  warning: '#865500',
  danger: '#B42318',
  onDanger: '#FFFFFF',
  info: '#006C9C',
} as const;

/** Semantic color tokens — dark theme (ocean). */
const darkColors = {
  background: '#020D1F',
  backdrop: 'rgba(1, 7, 18, 0.78)',
  surface: '#061A33',
  surfaceAlt: '#0A2847',
  chapterSurface: '#0A2847',
  eventImageScrim: 'rgba(2, 13, 31, 0.72)',
  eventImageText: '#FFFFFF',
  textPrimary: '#EDF8FF',
  textSecondary: '#BDD9ED',
  textMuted: '#90B5D0',
  primary: '#20C4F4',
  primaryPressed: '#79E2FF',
  onPrimary: '#021322',
  border: '#477899',
  focusRing: '#79E2FF',
  success: '#79D6A5',
  warning: '#F2C66D',
  danger: '#FF8A8A',
  onDanger: '#331B21',
  info: '#72CFFF',
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
