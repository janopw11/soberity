import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon, type SettingsIconName } from '../ui/SettingsIcon';
import { QUIZ_CATEGORIES, type QuizCategory } from './quizCategories';

const icons: Record<QuizCategory, SettingsIconName> = {
  brain: 'brain',
  relationships: 'people',
  'alco-facts': 'flask',
  sport: 'basketball',
};

export function QuizCategoryGrid({
  onSelect,
}: {
  onSelect: (category: QuizCategory) => void;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [focused, setFocused] = useState<QuizCategory | null>(null);
  const [hovered, setHovered] = useState<QuizCategory | null>(null);
  return (
    <View style={styles.section}>
      <View style={styles.grid}>
        {QUIZ_CATEGORIES.map((category) => (
          <View key={category} style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`learning.categories.${category}`)}
              accessibilityHint={t(`learning.topicDescriptions.${category}`)}
              onPress={() => onSelect(category)}
              onFocus={() => setFocused(category)}
              onBlur={() => setFocused(null)}
              onHoverIn={() => setHovered(category)}
              onHoverOut={() => setHovered(null)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor:
                    pressed || hovered === category
                      ? colors.listSurface
                      : colors.surface,
                  borderColor:
                    focused === category
                      ? colors.focusRing
                      : pressed || hovered === category
                        ? colors.primary
                        : colors.border,
                },
              ]}
            >
              <View
                style={styles.top}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View
                  style={[styles.icon, { backgroundColor: colors.listSurface }]}
                >
                  <SettingsIcon
                    name={icons[category]}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.primary }]}>
                  {t(`learning.categories.${category}`)}
                </Text>
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                >
                  {t(`learning.topicDescriptions.${category}`)}
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.space12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -spacing.space4 },
  cell: { width: '50%', minWidth: 0, padding: spacing.space4 },
  card: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    minHeight: 136,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.space12,
    gap: spacing.space12,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.space4 },
  title: { ...typography.bodyStrong },
  description: { ...typography.small },
});
