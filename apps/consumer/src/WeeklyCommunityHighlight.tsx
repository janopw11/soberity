import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro static assets */
const artwork = {
  light: require('../assets/images/community-icon-light.png'),
  dark: require('../assets/images/community-icon-dark.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Static preview until the community module supplies a real weekly highlight. */
export function WeeklyCommunityHighlight() {
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  return (
    <View
      testID="home-community-highlight"
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.art, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={artwork[theme]}
          style={styles.image}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
          importantForAccessibility="no"
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.preview, { color: colors.textMuted }]}>
          {t('home.communityHighlight.preview')}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.primary }]}
        >
          {t('home.communityHighlight.title')}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('home.communityHighlight.description')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 128,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: 'hidden',
  },
  art: {
    width: '25%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.space12,
  },
  image: { width: '100%', height: 96 },
  content: {
    flex: 1,
    minWidth: 0,
    padding: spacing.space16,
    gap: spacing.space8,
  },
  title: { ...typography.h3 },
  description: { ...typography.small },
  preview: { ...typography.caption },
});
