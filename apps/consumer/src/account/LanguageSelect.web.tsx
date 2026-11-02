import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import type { LanguageOption } from './LanguageSelect';

type LanguageSelectProps<T extends string> = {
  label: string;
  value: T;
  options: readonly LanguageOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
};

/** Native `<select>` on web; see LanguageSelect.tsx for the native fallback. */
export function LanguageSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  testID,
}: LanguageSelectProps<T>) {
  const { colors } = useThemePreferences();

  return (
    <select
      aria-label={label}
      data-testid={testID}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      style={{
        minHeight: 44,
        padding: `0 ${spacing.space8}px`,
        borderRadius: radii.sm,
        border: 'none',
        backgroundColor: 'transparent',
        color: colors.textPrimary,
        fontSize: typography.body.fontSize,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
