import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon, type SettingsIconName } from '../ui/SettingsIcon';
import { QUIZ_CATEGORIES, type QuizCategory } from './quizCategories';

export function QuizCategoryGrid({
  onSelect,
}: {
  onSelect: (category: QuizCategory) => void;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [focused, setFocused] = useState<QuizCategory | null>(null);
  const [hovered, setHovered] = useState<QuizCategory | null>(null);
  const backgrounds = {
    brain: colors.surfaceAlt,
    relationships: colors.quizRelationshipsSurface,
    'alco-facts': colors.quizHighSurface,
    sport: colors.quizMediumSurface,
  };
  const icons: Record<QuizCategory, SettingsIconName> = {
    brain: 'brain', relationships: 'people', 'alco-facts': 'question', sport: 'basketball',
  };
  return (
    <View style={styles.grid}>
      {QUIZ_CATEGORIES.map((category) => (
        <View key={category} style={styles.cell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(`learning.categories.${category}`)}
            onPress={() => onSelect(category)}
            onFocus={() => setFocused(category)}
            onBlur={() => setFocused(null)}
            onHoverIn={() => setHovered(category)}
            onHoverOut={() => setHovered(null)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: backgrounds[category],
                borderColor:
                  focused === category ? colors.focusRing : hovered === category || pressed ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.labelArea}>
              <Text style={[styles.title, { color: colors.primary }]}>
                {t(`learning.categories.${category}`)}
              </Text>
            </View>
            <View style={styles.footer} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={[styles.cornerSurface, { backgroundColor: colors.primary }]} />
              <View style={[styles.decoration, { opacity: hovered === category ? 0.28 : 0.18 }]}>
                <SettingsIcon name={icons[category]} color={colors.primary} size={48} />
              </View>
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.space8 },
  cell: { width: '50%', minWidth: 0, padding: spacing.space8 },
  card: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    minHeight: 160,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.space16,
    gap: spacing.space8,
    overflow: 'hidden',
  },
  labelArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.space8,
  },
  title: { ...typography.h3, textAlign: 'center', width: '100%' },
  // A separate footer keeps the decorative icon clear of wrapped/scaled labels.
  footer: { height: spacing.space48, width: '100%' },
  cornerSurface: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: radii.pill,
    right: -spacing.space40,
    bottom: -spacing.space40,
    opacity: 0.06,
  },
  decoration: {
    position: 'absolute',
    right: -spacing.space8,
    bottom: -spacing.space8,
  },
});
