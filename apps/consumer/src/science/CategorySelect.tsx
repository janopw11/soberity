import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';

export type CategorySelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

/** Overlay menu: keeps the category choices anchored below their field without a modal. */
export default function CategorySelect({ label, value, options, onChange }: CategorySelectProps) {
  const { colors } = useThemePreferences();
  const [scroll, setScroll] = useState({ offset: 0, viewport: 0, content: 0 });
  const [open, setOpen] = useState(false);
  const trackHeight = Math.max(0, scroll.viewport - spacing.space8);
  const thumbHeight = scroll.content > 0 ? Math.min(trackHeight, Math.max(24, trackHeight * scroll.viewport / scroll.content)) : 0;
  const scrollProgress = scroll.content > scroll.viewport ? Math.max(0, Math.min(1, scroll.offset / (scroll.content - scroll.viewport))) : 0;
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setOpen(false); return true; });
    return () => subscription.remove();
  }, [open]);
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: options.find(option => option.value === value)?.label }}
        accessibilityState={{ expanded: open }}
        onPress={() => { if (!open) setScroll(previous => ({ ...previous, offset: 0 })); setOpen(previous => !previous); }}
        style={({ pressed }) => [styles.trigger, { borderColor: open ? colors.focusRing : colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface }]}
      >
        <Text style={[styles.label, { color: colors.primary, fontWeight: '600' }]}>{options.find(option => option.value === value)?.label}</Text>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : undefined} accessible={false}>
          <SettingsIcon name="chevronDown" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
      {open ? <View style={[styles.menu, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ScrollView style={{ height: Math.min(options.length * 48, 200) }}
          keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}
          onLayout={event => { const viewport = event.nativeEvent.layout.height; setScroll(previous => ({ ...previous, viewport })); }}
          onContentSizeChange={(_width, content) => setScroll(previous => ({ ...previous, content }))}
          onScroll={event => { const offset = event.nativeEvent.contentOffset.y; setScroll(previous => ({ ...previous, offset })); }}
          scrollEventThrottle={16}
        >
        <View accessibilityRole="radiogroup" accessibilityLabel={label}>
          {options.map(option => <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: option.value === value }}
            onPress={() => { setOpen(false); onChange(option.value); }}
            style={({ pressed }) => [styles.option, { backgroundColor: pressed || option.value === value ? colors.surfaceAlt : colors.surface }]}
          >
            <Text style={[styles.label, { color: colors.primary, fontWeight: option.value === value ? '600' : '400' }]}>{option.label}</Text>
            {option.value === value ? <SettingsIcon name="check" size={16} color={colors.primary} /> : null}
          </Pressable>)}
        </View>
        </ScrollView>
        {scroll.content > scroll.viewport && scroll.viewport > 0 ? <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={[styles.scrollTrack, { backgroundColor: colors.surfaceAlt }]}
        >
          <View style={{ position: 'absolute', left: 0, right: 0, backgroundColor: colors.primary, borderRadius: radii.pill,
            height: thumbHeight,
            top: scrollProgress * (trackHeight - thumbHeight),
          }} />
        </View> : null}
      </View> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 20 },
  trigger: { minHeight: 48, paddingHorizontal: spacing.space8, borderWidth: 1, borderRadius: radii.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
  label: { ...typography.small, flex: 1, minWidth: 0 },
  menu: { position: 'absolute', top: '100%', marginTop: spacing.space4, left: 0, right: 0, zIndex: 20, overflow: 'hidden', borderWidth: 1, borderRadius: radii.sm },
  scrollTrack: { position: 'absolute', top: spacing.space4, bottom: spacing.space4, right: spacing.space4 / 2, width: spacing.space4, borderRadius: radii.pill },
  option: { minHeight: 48, padding: spacing.space8, paddingRight: spacing.space16, flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
});
