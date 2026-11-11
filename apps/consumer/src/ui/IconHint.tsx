import { useId, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

type IconHintProps = {
  text: string;
  children: ReactNode;
  /** Border badge: accessible target, right-aligned popover below the icon. */
  pill?: boolean;
  circle?: boolean;
};

/** Hover/focus hints with a separately toggleable tap state on every platform. */
export function IconHint({ text, children, pill = false, circle = false }: IconHintProps) {
  const { colors } = useThemePreferences();
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && (hovered || focused || pinned);
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={text}
    accessibilityState={{ expanded: visible }}
    onHoverIn={() => { setHovered(true); setDismissed(false); }}
    onHoverOut={() => setHovered(false)}
    onFocus={() => { setFocused(true); setDismissed(false); }}
    onBlur={() => { setFocused(false); setPinned(false); }}
    onPress={event => { event.stopPropagation(); setDismissed(false); setPinned(value => !value); }}
    onLongPress={() => { setDismissed(false); setPinned(true); }}
    {...(Platform.OS === 'web' ? {
      'aria-describedby': visible ? id : undefined,
      onKeyDown: (event: { nativeEvent?: { key?: string }; key?: string; stopPropagation: () => void }) => {
        if ((event.key ?? event.nativeEvent?.key) === 'Escape') { setDismissed(true); setPinned(false); event.stopPropagation(); }
      },
    } : {})}
    style={[
      styles.wrap,
      (pill || circle) && styles.pillTarget,
    ]}
  >
    {pill || circle ? <View style={[styles.pill, circle && styles.circle, { backgroundColor: colors.primary, borderColor: focused ? colors.focusRing : circle ? 'transparent' : colors.surface }]}>{children}</View> : children}
    {visible ? <View
      nativeID={id}
      pointerEvents="none"
      importantForAccessibility="no"
      {...(Platform.OS === 'web' ? { role: 'tooltip' as const } : {})}
      style={[styles.bubble, circle ? styles.bubbleBelowLeft : pill ? styles.bubbleBelow : styles.bubbleAbove, { backgroundColor: colors.textPrimary }]}
    >
      <Text style={[styles.text, { color: colors.background }]}>{text}</Text>
    </View> : null}
  </Pressable>;
}
const styles = StyleSheet.create({
  wrap: { minWidth: 22, minHeight: 22, justifyContent: 'center' },
  pillTarget: { minWidth: 48, minHeight: 44, alignItems: 'center' },
  pill: { minWidth: 36, minHeight: 28, justifyContent: 'center', alignItems: 'center', borderRadius: radii.pill, borderWidth: 2, paddingHorizontal: spacing.space8, paddingVertical: spacing.space4 },
  circle: { width: 19, height: 19, minWidth: 19, minHeight: 19, paddingHorizontal: 0, paddingVertical: 0 },
  bubbleBelowLeft: { top: '100%', left: 0, marginTop: spacing.space8 },
  bubble: { position: 'absolute', width: 200, maxWidth: 240, paddingHorizontal: spacing.space12, paddingVertical: spacing.space8, borderRadius: radii.sm, zIndex: 30, elevation: 4 },
  bubbleAbove: { bottom: '100%', left: 0, marginBottom: spacing.space8 },
  bubbleBelow: { top: '100%', right: 0, marginTop: spacing.space8 },
  text: { ...typography.small, fontWeight: typography.label.fontWeight },
});
