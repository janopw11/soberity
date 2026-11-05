import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Screen, SettingsIcon } from './ui';

type PrincipleKey = 'science' | 'sober' | 'community' | 'respect';

function PrincipleSection({ principle }: { principle: PrincipleKey }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.principle, { borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(`about.identity.values.${principle}`)}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.valueRow,
          {
            borderColor: focused ? colors.focusRing : 'transparent',
            backgroundColor: pressed ? colors.listSurface : 'transparent',
          },
        ]}
      >
        <SettingsIcon
          name={
            principle === 'science'
              ? 'flask'
              : principle === 'sober'
                ? 'sun'
                : principle === 'community'
                  ? 'people'
                  : 'check'
          }
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.valueLabel, { color: colors.textPrimary }]}>
          {t(`about.identity.values.${principle}`)}
        </Text>
        <SettingsIcon
          name={expanded ? 'chevronDown' : 'chevron'}
          size={18}
          color={colors.primary}
        />
      </Pressable>
      {expanded ? (
        <Text
          style={[styles.principleDescription, { color: colors.textSecondary }]}
        >
          {t(`about.identity.valueDescriptions.${principle}`)}
        </Text>
      ) : null}
    </View>
  );
}

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <Screen maxWidth={800}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.primary }]}
          >
            {t('about.identity.title')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('about.identity.copy')}
          </Text>
        </View>
        <View style={styles.values}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.primary }]}
          >
            {t('about.identity.principlesTitle')}
          </Text>
          {(['science', 'sober', 'community', 'respect'] as const).map(
            (key) => (
              <PrincipleSection key={key} principle={key} />
            ),
          )}
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  page: { gap: spacing.space24, paddingBottom: spacing.space16 },
  hero: { gap: spacing.space8, paddingVertical: spacing.space16 },
  body: { ...typography.body, maxWidth: 560 },
  sectionTitle: { ...typography.h3 },
  values: { gap: spacing.space12 },
  principle: { borderBottomWidth: StyleSheet.hairlineWidth },
  principleDescription: {
    ...typography.small,
    paddingHorizontal: spacing.space12,
    paddingBottom: spacing.space16,
  },
  valueRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.space4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space12,
    paddingVertical: spacing.space12,
  },
  valueLabel: { ...typography.body, flex: 1 },
});
