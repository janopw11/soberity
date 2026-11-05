import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui';
import type { SettingsIconName } from '../ui/SettingsIcon';

export function FilterIconButton({
  label,
  icon,
  onPress,
  previous = false,
  quiet = false,
}: {
  label: string;
  icon: SettingsIconName;
  onPress: () => void;
  previous?: boolean;
  quiet?: boolean;
}) {
  const { colors } = useThemePreferences();
  const destructive = icon === 'eraser';
  const [focused, setFocused] = useState(false);
  const [hint, setHint] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        setHint(false);
        onPress();
      }}
      onLongPress={() => setHint(true)}
      onHoverIn={() => setHint(true)}
      onHoverOut={() => setHint(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setHint(false);
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: destructive
            ? colors.danger
            : pressed
              ? colors.surfaceAlt
              : quiet
                ? 'transparent'
                : colors.surface,
          borderColor: destructive
            ? colors.danger
            : focused
              ? colors.focusRing
              : quiet
                ? 'transparent'
                : colors.border,
          borderWidth: quiet ? 1 : 2,
          borderRadius: quiet ? radii.pill : radii.md,
          opacity: destructive && pressed ? 0.8 : 1,
          ...(destructive && focused && Platform.OS === 'web'
            ? {
                outlineColor: colors.focusRing,
                outlineWidth: 2,
                outlineOffset: 2,
                outlineStyle: 'solid' as const,
              }
            : {}),
        },
      ]}
    >
      <View style={previous ? styles.previous : undefined}>
        <SettingsIcon
          name={icon}
          color={
            destructive
              ? colors.onDanger
              : quiet
                ? colors.textMuted
                : colors.primary
          }
          size={quiet ? 18 : 22}
        />
      </View>
      {hint || focused ? (
        <View
          pointerEvents="none"
          accessible={false}
          {...(Platform.OS === 'web' ? { role: 'tooltip' as const } : {})}
          style={[styles.hint, { backgroundColor: colors.textPrimary }]}
        >
          <Text style={[styles.caption, { color: colors.background }]}>
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  previous: { transform: [{ rotate: '180deg' }] },
  hint: {
    position: 'absolute',
    bottom: '100%',
    width: 160,
    padding: spacing.space8,
    marginBottom: spacing.space4,
    borderRadius: radii.sm,
    zIndex: 10,
  },
  caption: { ...typography.caption, textAlign: 'center' },
});
