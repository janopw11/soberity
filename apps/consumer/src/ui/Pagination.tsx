import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from './SettingsIcon';

export function Pagination({
  page,
  size,
  total,
  label,
  onPageChange,
}: {
  page: number;
  size: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  const { colors } = useThemePreferences();
  return (
    <View style={[styles.pagination, { backgroundColor: colors.surfaceAlt }]}>
      <PageArrow
        direction="previous"
        disabled={page === 0}
        onPress={() => onPageChange(Math.max(0, page - 1))}
      />
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.pageLabel, { color: colors.textSecondary }]}
      >
        {label}
      </Text>
      <PageArrow
        direction="next"
        disabled={(page + 1) * size >= total}
        onPress={() => onPageChange(page + 1)}
      />
    </View>
  );
}

function PageArrow({
  direction,
  disabled,
  onPress,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`discover.${direction}`)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.pageArrow,
        {
          backgroundColor:
            !disabled && (pressed || hovered) ? colors.surface : 'transparent',
          borderColor: focused ? colors.focusRing : 'transparent',
        },
      ]}
    >
      <View
        style={direction === 'previous' ? styles.arrowLeft : undefined}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SettingsIcon
          name="chevron"
          size={20}
          color={disabled ? colors.textMuted : colors.primary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pagination: {
    alignSelf: 'center',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    padding: spacing.space4,
    gap: spacing.space4,
  },
  pageArrow: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  arrowLeft: { transform: [{ rotate: '180deg' }] },
  pageLabel: { ...typography.small, flexShrink: 1, textAlign: 'center' },
});
