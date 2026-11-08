import type { CSSProperties } from 'react';
import { radii } from '@soberity/design-tokens';

type Palette = {
  primary: string;
  onPrimary: string;
  surface: string;
  border: string;
};

/** Buttons for map surfaces: a filled primary action and an outlined secondary action. Compact sizes sit closer to 13–14px labels. */
export function mapButtonStyle(
  palette: Palette,
  variant: 'primary' | 'secondary',
  size: 'regular' | 'compact' = 'regular',
): CSSProperties {
  const base: CSSProperties = {
    minHeight: size === 'compact' ? 36 : 48,
    minWidth: size === 'compact' ? 36 : 48,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: size === 'compact' ? '0 12px' : '0 16px',
    borderRadius: radii.md,
    fontFamily: 'inherit',
    fontSize: size === 'compact' ? 13 : 15,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };
  return variant === 'primary'
    ? {
        ...base,
        background: palette.primary,
        color: palette.onPrimary,
        border: `1px solid ${palette.primary}`,
      }
    : {
        ...base,
        background: palette.surface,
        color: palette.primary,
        border: `1px solid ${palette.border}`,
      };
}
