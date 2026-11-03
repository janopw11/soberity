import { Children, Fragment, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { IconHint } from './IconHint';
import { SettingsIcon, type SettingsIconName } from './SettingsIcon';

/** Rounded surface that groups rows and fields with hairline separators between them. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  const { colors } = useThemePreferences();
  const styles = createGroupStyles(colors);
  const items = Children.toArray(children);

  return (
    <View style={styles.group}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={styles.separator} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

/** Small heading above a group, e.g. "Theme". */
export function SettingsSectionLabel({ children }: { children: ReactNode }) {
  const { colors } = useThemePreferences();
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: colors.textSecondary,
        fontSize: typography.small.fontSize,
        lineHeight: typography.small.lineHeight,
        fontWeight: typography.label.fontWeight,
        paddingHorizontal: spacing.space16,
      }}
    >
      {children}
    </Text>
  );
}

type SettingsRowProps = {
  label: string;
  /** Allows longer acknowledgement text to remain fully visible. */
  multilineLabel?: boolean;
  icon?: SettingsIconName;
  /** Shows the label only as a popover on the icon; the value takes its place. */
  labelAsHint?: boolean;
  /** Muted value for placeholders such as "Add a username". */
  valueMuted?: boolean;
  /** Current value shown on the trailing side, e.g. the account e-mail. */
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  /** Muted red styling for destructive actions; never a filled button. */
  destructive?: boolean;
  /** Primary action row (e.g. "Save"): accent-coloured label, no fill. */
  accent?: boolean;
  /** Radio mark for options: shows a check when selected. */
  selected?: boolean;
  /** Checkbox row: shows a box that is ticked when `checked`. */
  checkbox?: boolean;
  checked?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  testID?: string | undefined;
};

/** Settings row: 56px min height, icon, label, optional value/chevron. Read-only when there is no onPress. */
export function SettingsRow({
  label,
  icon,
  multilineLabel = false,
  labelAsHint = false,
  valueMuted = false,
  value,
  onPress,
  showChevron = false,
  destructive = false,
  accent = false,
  selected,
  checkbox = false,
  checked = false,
  disabled = false,
  trailing,
  testID,
}: SettingsRowProps) {
  const { colors } = useThemePreferences();
  const styles = createRowStyles(colors);
  const [isFocused, setIsFocused] = useState(false);
  const tone = destructive ? colors.danger : colors.primary;
  const interactive = Boolean(onPress);
  const hinted = labelAsHint && Boolean(icon);

  const iconElement = icon ? <SettingsIcon name={icon} color={tone} /> : null;

  const content = (
    <>
      {hinted ? <IconHint text={label}>{iconElement}</IconHint> : iconElement}
      <View style={styles.text}>
        {hinted ? null : (
          <Text
            style={[
              styles.label,
              accent && styles.accentLabel,
              destructive && { color: colors.danger },
            ]}
            numberOfLines={multilineLabel ? 0 : 1}
          >
            {label}
          </Text>
        )}
        {hinted && value ? (
          <Text
            style={[styles.label, valueMuted && { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {!hinted && value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {selected ? (
        <SettingsIcon name="check" color={colors.primary} size={20} />
      ) : null}
      {checkbox ? (
        <View
          style={[styles.box, checked && styles.boxChecked]}
          importantForAccessibility="no"
        >
          {checked ? (
            <SettingsIcon name="check" color={colors.onPrimary} size={16} />
          ) : null}
        </View>
      ) : null}
      {trailing}
      {showChevron ? (
        <SettingsIcon name="chevron" color={colors.textMuted} size={20} />
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  const role = checkbox
    ? 'checkbox'
    : selected !== undefined
      ? 'radio'
      : 'button';

  return (
    <Pressable
      accessibilityRole={role}
      aria-checked={checkbox ? checked : selected}
      accessibilityLabel={label}
      accessibilityValue={value ? { text: value } : undefined}
      accessibilityState={{
        disabled,
        selected: selected ?? undefined,
        checked: checkbox ? checked : selected,
      }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        isFocused && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

function createGroupStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    group: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
}

function createRowStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    row: {
      minHeight: 56,
      paddingHorizontal: spacing.space16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.space16,
    },
    text: { flex: 1 },
    label: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    accentLabel: {
      color: colors.primary,
      fontWeight: typography.label.fontWeight,
    },
    value: {
      maxWidth: '55%',
      color: colors.textSecondary,
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: radii.sm,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    pressed: { backgroundColor: colors.surfaceAlt },
    focused: {
      borderWidth: 2,
      borderColor: colors.focusRing,
      borderRadius: radii.md,
    },
    disabled: { opacity: 0.5 },
  });
}
