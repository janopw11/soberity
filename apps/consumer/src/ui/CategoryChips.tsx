import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

export function CategoryChips({
  options,
  value,
  onChange,
  twoRows = false,
  dense = false,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  twoRows?: boolean;
  dense?: boolean;
}) {
  const chip = (option: { value: string; label: string }) => (
    <CategoryChip
      key={option.value}
      label={option.label}
      dense={dense}
      selected={value === option.value}
      onPress={() => onChange(value === option.value ? '' : option.value)}
    />
  );
  if (twoRows) {
    const midpoint = Math.ceil(options.length / 2);
    return (
      <View style={styles.rows}>
        <View style={[styles.row, styles.wrappedRow]}>
          {options.slice(0, midpoint).map(chip)}
        </View>
        <View style={[styles.row, styles.wrappedRow]}>
          {options.slice(midpoint).map(chip)}
        </View>
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {options.map(chip)}
    </ScrollView>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
  dense = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  dense?: boolean;
}) {
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={styles.target}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.chip,
            dense && {
              minHeight: 28,
              paddingHorizontal: spacing.space8,
              paddingVertical: spacing.space4 / 2,
            },
            {
              backgroundColor: selected
                ? pressed
                  ? colors.primaryPressed
                  : colors.primary
                : pressed
                  ? colors.surfaceAlt
                  : colors.listSurface,
              borderColor: focused
                ? colors.focusRing
                : selected
                  ? colors.primary
                  : 'transparent',
              borderWidth: focused ? 2 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: selected ? colors.onPrimary : colors.textSecondary },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rows: { width: '100%', minWidth: 0 },
  wrappedRow: { flexWrap: 'wrap' },
  scroller: { flexGrow: 0, flexShrink: 1, minWidth: 0, width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space4,
    paddingHorizontal: spacing.space4 / 2,
  },
  target: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    flexShrink: 0,
    maxWidth: '100%',
  },
  chip: {
    minHeight: 32,
    minWidth: 48,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.small, fontWeight: '600' },
});
