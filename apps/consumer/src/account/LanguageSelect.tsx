import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Dialog } from '../ui';
import { SettingsIcon } from '../ui/SettingsIcon';

export type LanguageOption<T extends string> = { value: T; label: string };

type LanguageSelectProps<T extends string> = {
  label: string;
  value: T;
  options: readonly LanguageOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

/** Native fallback for `<select>`: a button that opens a list in a dialog. Web uses LanguageSelect.web.tsx. */
export function LanguageSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  testID,
  fullWidth = false,
  compact = false,
}: LanguageSelectProps<T>) {
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const current = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: current?.label }}
        onPress={() => setOpen(true)}
        testID={testID}
        style={({ pressed }) => [styles.trigger, fullWidth && { width: '100%' }, compact && { minHeight: 46 }, pressed && styles.pressed]}
      >
        <Text style={[styles.triggerText, compact && typography.small, fullWidth && { flex: 1, minWidth: 0 }]}>{current?.label ?? ''}</Text>
        <SettingsIcon name="chevronDown" color={colors.textMuted} size={18} />
      </Pressable>
      <Dialog
        visible={open}
        title={label}
        onClose={() => setOpen(false)}
        closeLabel={t('common.close')}
      >
        <View accessibilityRole="radiogroup" style={styles.list}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected, selected }}
                onPress={() => {
                  setOpen(false);
                  if (!selected) onChange(option.value);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.optionText}>
                  {selected ? '✓ ' : ''}
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Dialog>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    trigger: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.space8,
    },
    triggerText: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    pressed: { opacity: 0.85 },
    list: { gap: spacing.space8 },
    option: {
      minHeight: 48,
      paddingHorizontal: spacing.space16,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
    },
    optionText: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
  });
}
