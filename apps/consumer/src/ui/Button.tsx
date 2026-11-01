import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

export type ButtonVariant =
  'primary' | 'secondary' | 'tertiary' | 'destructive';

type ButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** Primary interactive control. Min height 48, visible focus ring, loading/disabled states. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const isDisabled = disabled || loading;
  const variantStyle = createVariantStyles(colors)[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && variantStyle.pressed,
        isFocused && styles.focused,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.indicatorColor} />
      ) : (
        <Text style={[styles.label, variantStyle.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: spacing.space24,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    disabled: { opacity: 0.5 },
    focused: {
      borderWidth: 2,
      borderColor: colors.focusRing,
    },
    label: {
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: typography.label.fontWeight,
    },
  });
}

function createVariantStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
): Record<
  ButtonVariant,
  {
    container: ViewStyle;
    pressed: ViewStyle;
    label: { color: string; textDecorationLine?: 'underline' };
    indicatorColor: string;
  }
> {
  return {
    primary: {
      container: { backgroundColor: colors.primary },
      pressed: { backgroundColor: colors.primaryPressed },
      label: { color: colors.onPrimary },
      indicatorColor: colors.onPrimary,
    },
    secondary: {
      container: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
      },
      pressed: { backgroundColor: colors.border },
      label: { color: colors.textPrimary },
      indicatorColor: colors.textPrimary,
    },
    tertiary: {
      container: { backgroundColor: 'transparent' },
      pressed: { backgroundColor: colors.surfaceAlt },
      label: { color: colors.primary, textDecorationLine: 'underline' },
      indicatorColor: colors.primary,
    },
    destructive: {
      container: { backgroundColor: colors.danger },
      pressed: { opacity: 0.85 },
      label: { color: colors.onDanger },
      indicatorColor: colors.onDanger,
    },
  };
}
