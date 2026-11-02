import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';

type IconHintProps = {
  text: string;
  children: ReactNode;
};

/** Shows `text` as a popover on hover (web), or on tap/long press (native). The icon stays the visible label. */
export function IconHint({ text, children }: IconHintProps) {
  const { colors } = useThemePreferences();
  const [visible, setVisible] = useState(false);

  return (
    <Pressable
      accessibilityRole="image"
      accessibilityLabel={text}
      onHoverIn={() => setVisible(true)}
      onHoverOut={() => setVisible(false)}
      onPress={() => setVisible((value) => !value)}
      onLongPress={() => setVisible(true)}
      style={styles.wrap}
    >
      {children}
      {visible ? (
        <View
          pointerEvents="none"
          importantForAccessibility="no"
          style={[styles.bubble, { backgroundColor: colors.textPrimary }]}
        >
          <Text
            numberOfLines={1}
            style={[styles.text, { color: colors.background }]}
          >
            {text}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 22, minHeight: 22, justifyContent: 'center' },
  bubble: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: spacing.space8,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space4,
    borderRadius: radii.sm,
    zIndex: 10,
    elevation: 4,
  },
  text: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: typography.label.fontWeight,
  },
});
