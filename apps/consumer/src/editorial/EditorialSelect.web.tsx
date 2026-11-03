import { useId } from 'react';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import type { SelectProps } from './EditorialSelect';

export default function EditorialSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: SelectProps) {
  const { colors } = useThemePreferences();
  const id = useId();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.space8,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <label
        htmlFor={id}
        style={{
          color: colors.primary,
          fontSize: typography.label.fontSize,
          fontWeight: typography.label.fontWeight,
          lineHeight: `${typography.label.lineHeight}px`,
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          minHeight: 48,
          width: '100%',
          padding: spacing.space12,
          borderRadius: radii.md,
          color: colors.textPrimary,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          fontSize: typography.body.fontSize,
          fontFamily: 'inherit',
          outlineColor: colors.focusRing,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
