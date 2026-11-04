import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';

import { SettingsIcon, type SettingsIconName } from './ui/SettingsIcon';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/** A non-interactive chapter divider; titles wrap and respect system font scaling. */
export function ChapterHeading({ children, icon }: PropsWithChildren<{ icon?: SettingsIconName }>) {
  const { colors } = useThemePreferences();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.chapter}>
      <View
        pointerEvents="none"
        accessible={false}
        style={[styles.background, { width, left: '50%', transform: [{ translateX: -width / 2 }], backgroundColor: colors.chapterSurface }]}
      />
      {icon ? <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
        <SettingsIcon name={icon} color={colors.primary} size={22} />
      </View> : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.primary }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chapter: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
    paddingVertical: spacing.space8,
  },
  icon: { flexShrink: 0 },
  background: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  title: {
    ...typography.h3,
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-medium',
      web: '"Avenir Next", "Century Gothic", sans-serif',
    }),
    fontWeight: '600',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
});
