import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

type AlertProps = {
  variant?: AlertVariant;
  /** Short, localized label describing the kind of message (e.g. "Error"). Optional. */
  title?: string;
  message: string;
};

/** Inline message that always pairs color with text, never color alone (docs/BRANDING.md §3.2). */
export function Alert({ variant = 'info', title, message }: AlertProps) {
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const accentColor = colors[variant];

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={[
        styles.container,
        { borderColor: accentColor, backgroundColor: colors.surfaceAlt },
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
      ) : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.space16,
      gap: spacing.space4,
    },
    title: {
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: typography.label.fontWeight,
    },
    message: {
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
  });
}
