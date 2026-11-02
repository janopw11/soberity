import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { IconHint } from './IconHint';
import { SettingsIcon, type SettingsIconName } from './SettingsIcon';
import { SettingsRow } from './SettingsRow';

type InlineEditRowProps = {
  icon: SettingsIconName;
  /** Field name: shown as popover on the icon and used for screen readers. */
  label: string;
  /** Text shown while not editing; pass a placeholder when the field is empty. */
  displayValue: string;
  displayIsPlaceholder?: boolean;
  editing: boolean;
  onStartEdit: () => void;
  draft: string;
  onChangeDraft: (value: string) => void;
  placeholder: string;
  helperText?: string | undefined;
  error?: string | undefined;
  saveLabel: string;
  canSave: boolean;
  saving?: boolean;
  onSave: () => void;
  /** Masks input and adds a show/hide toggle. */
  secure?: boolean;
  revealLabels?: { show: string; hide: string };
  maxLength?: number | undefined;
  autoCapitalize?: 'none' | 'sentences';
  testID?: string | undefined;
};

/**
 * One settings field. Shows as a row with a pencil; tapping it turns the same row into an
 * input with an inline Save action, so the layout does not jump.
 */
export function InlineEditRow({
  icon,
  label,
  displayValue,
  displayIsPlaceholder = false,
  editing,
  onStartEdit,
  draft,
  onChangeDraft,
  placeholder,
  helperText,
  error,
  saveLabel,
  canSave,
  saving = false,
  onSave,
  secure = false,
  revealLabels,
  maxLength,
  autoCapitalize = 'none',
  testID,
}: InlineEditRowProps) {
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [revealed, setRevealed] = useState(false);

  if (!editing) {
    return (
      <SettingsRow
        icon={icon}
        labelAsHint
        label={label}
        value={displayValue}
        valueMuted={displayIsPlaceholder}
        trailing={
          <SettingsIcon name="pencil" color={colors.primary} size={20} />
        }
        onPress={onStartEdit}
        testID={testID}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <IconHint text={label}>
          <SettingsIcon name={icon} color={colors.primary} />
        </IconHint>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secure && !revealed}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSave}
          style={styles.input}
          testID={testID ? `${testID}-input` : undefined}
        />
        {secure && revealLabels ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              revealed ? revealLabels.hide : revealLabels.show
            }
            onPress={() => setRevealed((value) => !value)}
            hitSlop={8}
            style={styles.iconAction}
          >
            <SettingsIcon
              name={revealed ? 'eyeOff' : 'eye'}
              color={colors.textSecondary}
              size={22}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          accessibilityState={{ disabled: !canSave, busy: saving }}
          disabled={!canSave}
          onPress={onSave}
          hitSlop={8}
          style={styles.saveAction}
          testID={testID ? `${testID}-save` : undefined}
        >
          <Text
            style={[
              styles.saveLabel,
              { color: canSave ? colors.primary : colors.textMuted },
            ]}
          >
            {saveLabel}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    container: {
      minHeight: 56,
      paddingHorizontal: spacing.space16,
      paddingVertical: spacing.space8,
      gap: spacing.space4,
    },
    row: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.space16,
    },
    input: {
      flex: 1,
      minHeight: 44,
      paddingVertical: 0,
      borderRadius: radii.sm,
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    iconAction: {
      minWidth: 32,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveAction: {
      minHeight: 44,
      justifyContent: 'center',
    },
    saveLabel: {
      fontSize: typography.label.fontSize,
      fontWeight: typography.label.fontWeight,
    },
    error: {
      color: colors.danger,
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
    },
  });
}
