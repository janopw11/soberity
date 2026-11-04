import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from './SettingsIcon';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Smaller visual treatment for filter bars; other forms keep their defaults. */
  compact?: boolean;
  helperText?: string;
  errorText?: string | undefined;
  /** Adds a show/hide toggle for password-style fields. */
  secureToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  /** `grouped` drops the box so the field sits inside a SettingsGroup row. */
  variant?: 'boxed' | 'grouped';
  /** Renders the label in the primary accent colour. */
  accentLabel?: boolean;
  /** Inline control at the trailing edge of the input, e.g. a Save action. */
  accessory?: ReactNode;
  testID?: string;
};

/** Labelled text input with helper/error state and an optional password reveal toggle. */
export function TextField({
  label,
  compact = false,
  helperText,
  errorText,
  secureToggle = false,
  secureTextEntry,
  showPasswordLabel = 'Show',
  hidePasswordLabel = 'Hide',
  variant = 'boxed',
  accentLabel = false,
  accessory,
  onFocus,
  onBlur,
  testID,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const hasError = Boolean(errorText);
  const grouped = variant === 'grouped';

  return (
    <View
      style={[grouped ? styles.groupedContainer : styles.container, compact && styles.compactContainer]}
      testID={testID}
    >
      <Text style={[styles.label, compact && styles.compactLabel, accentLabel && { color: colors.primary }]}>
        {label}
      </Text>
      <View
        style={[
          grouped ? styles.groupedInputRow : styles.inputRow,
          isFocused &&
            (grouped ? styles.groupedInputRowFocused : styles.inputRowFocused),
          compact && styles.compactRow,
          hasError && !grouped && styles.inputRowError,
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={errorText ?? helperText}
          secureTextEntry={secureToggle ? !isRevealed : secureTextEntry}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, compact && styles.compactInput]}
          placeholderTextColor={colors.textMuted}
        />
        {accessory}
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isRevealed ? hidePasswordLabel : showPasswordLabel
            }
            onPress={() => setIsRevealed((value) => !value)}
            hitSlop={8}
            style={styles.toggle}
          >
            <SettingsIcon
              name={isRevealed ? 'eyeOff' : 'eye'}
              color={colors.textSecondary}
              size={22}
            />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    container: { gap: spacing.space8 },
    compactContainer: { gap: spacing.space4 },
    compactLabel: { ...typography.caption },
    compactRow: {
      minHeight: Platform.OS === 'web' ? 40 : 48,
      borderWidth: 1,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.space8,
    },
    compactInput: {
      ...typography.small,
      minWidth: 0,
      minHeight: Platform.OS === 'web' ? 38 : 46,
      paddingVertical: 0,
    },
    label: {
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: typography.label.fontWeight,
      color: colors.textPrimary,
    },
    inputRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.space16,
    },
    inputRowFocused: { borderColor: colors.focusRing, borderWidth: 2 },
    inputRowError: { borderColor: colors.danger },
    groupedContainer: {
      paddingHorizontal: spacing.space16,
      paddingVertical: spacing.space12,
      gap: spacing.space4,
    },
    groupedInputRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.space12,
    },
    groupedInputRowFocused: {
      borderWidth: 2,
      borderColor: colors.focusRing,
    },
    input: {
      flex: 1,
      minHeight: 48,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textPrimary,
    },
    toggle: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
      color: colors.danger,
    },
    helperText: {
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
      color: colors.textSecondary,
    },
  });
}
