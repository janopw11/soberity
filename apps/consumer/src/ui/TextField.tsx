import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radii, spacing, typography } from '@soberity/design-tokens';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helperText?: string;
  errorText?: string;
  /** Adds a show/hide toggle for password-style fields. */
  secureToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  testID?: string;
};

/** Labelled text input with helper/error state and an optional password reveal toggle. */
export function TextField({
  label,
  helperText,
  errorText,
  secureToggle = false,
  secureTextEntry,
  showPasswordLabel = 'Show',
  hidePasswordLabel = 'Hide',
  onFocus,
  onBlur,
  testID,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          hasError && styles.inputRowError,
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
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
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
            <Text style={styles.toggleLabel}>
              {isRevealed ? hidePasswordLabel : showPasswordLabel}
            </Text>
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

const styles = StyleSheet.create({
  container: { gap: spacing.space8 },
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
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
  },
  toggle: {
    paddingHorizontal: spacing.space8,
    paddingVertical: spacing.space8,
  },
  toggleLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.primary,
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
