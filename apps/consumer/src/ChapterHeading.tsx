import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from './preferences/ThemePreferencesContext';

/** A non-interactive chapter divider; titles wrap and respect system font scaling. */
export function ChapterHeading({ children }: PropsWithChildren) {
  const { colors } = useThemePreferences();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.chapter}>
      <View
        pointerEvents="none"
        accessible={false}
        style={[styles.background, { width, backgroundColor: colors.chapterSurface }]}
      />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.primary }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chapter: {
    alignSelf: 'stretch',
    paddingVertical: spacing.space8,
  },
  background: {
    position: 'absolute',
    alignSelf: 'center',
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
