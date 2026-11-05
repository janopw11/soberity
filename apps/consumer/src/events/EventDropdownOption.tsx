import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';

/** Compact Events-only menu row; account/settings rows keep their existing sizing. */
export function EventDropdownOption({
  label,
  description,
  kind = 'button',
  checked = false,
  onPress,
}: {
  label: string;
  description?: string;
  kind?: 'button' | 'checkbox' | 'radio';
  checked?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={kind === 'button' ? undefined : { checked }}
      aria-checked={kind === 'button' ? undefined : checked}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor:
            pressed || checked || focused ? colors.surfaceAlt : colors.surface,
          borderColor: focused ? colors.focusRing : 'transparent',
        },
      ]}
    >
      <View style={styles.copy}>
        <Text
          style={[
            styles.label,
            { color: checked ? colors.primary : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            numberOfLines={1}
            style={[styles.description, { color: colors.textMuted }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {kind === 'checkbox' ? (
        <View
          accessible={false}
          style={[
            styles.checkbox,
            { borderColor: checked ? colors.primary : colors.border },
          ]}
        >
          {checked ? (
            <SettingsIcon name="check" color={colors.primary} size={12} />
          ) : null}
        </View>
      ) : kind === 'radio' && checked ? (
        <SettingsIcon name="check" color={colors.primary} size={16} />
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  option: {
    minHeight: 48,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
    borderWidth: 1,
  },
  copy: { flex: 1, minWidth: 0, gap: spacing.space4 / 2 },
  label: { ...typography.small },
  description: { ...typography.caption },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: radii.sm / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
