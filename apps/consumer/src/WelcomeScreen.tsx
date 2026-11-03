import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';

import { Screen, SettingsIcon } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import DiscoverScreen from './science/DiscoverScreen';

// Metro requires a literal require() to statically bundle React Native assets.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const worldMapImage = require('../assets/images/world-map-realistic.png');

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { width } = useWindowDimensions();
  const imageHeight = Math.min(180, Math.max(150, width * 0.45));
  const styles = createStyles(colors, imageHeight);

  return (
    <Screen maxWidth={800}>
      <View style={styles.welcomeBlock}>
        <Text accessibilityRole="header" style={styles.welcomeTitle}>
          {t('home.missionHeadline')}
        </Text>
        <Text style={styles.welcomeSubtitle}>{t('home.missionSubtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('home.todaysSpotlight')}
        </Text>
        <Pressable
          style={[styles.tile, styles.featureCard]}
          accessibilityRole="button"
          accessibilityLabel={`${t('home.worldMapStatsTitle')}. ${t('home.openSection')}`}
          accessibilityHint={t('home.previewOnlyHint')}
          accessibilityState={{ disabled: true }}
          testID="home-for-you-today"
        >
          <Image
            source={worldMapImage}
            style={styles.cardImage}
            resizeMode="cover"
            fadeDuration={0}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <View style={styles.featureContent} pointerEvents="none">
            <Text style={styles.featureCategory}>
              {t('home.interactiveDiscovery')}
            </Text>
            <View style={styles.featureTitleRow}>
              <Text accessibilityRole="header" style={styles.featureTitle}>
                {t('home.worldMapStatsTitle')}
              </Text>
              <SettingsIcon name="chevron" color={colors.textMuted} size={20} />
            </View>
            <Text style={styles.featureDescription}>
              {t('home.worldMapStats')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('home.eventsNearYou')}
        </Text>
        <Text style={styles.eventsEmpty}>{t('home.eventsNotAvailable')}</Text>
      </View>

      <DiscoverScreen compact />
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
  imageHeight: number,
) {
  return StyleSheet.create({
    welcomeBlock: {
      gap: spacing.space4,
      paddingTop: spacing.space8,
    },
    welcomeTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: -0.45,
    },
    welcomeSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    section: { gap: spacing.space12 },
    tile: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radii.lg,
      padding: spacing.space16,
    },
    cardImage: {
      width: '100%',
      height: imageHeight,
    },
    featureCard: {
      padding: 0,
      overflow: 'hidden',
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    featureContent: {
      gap: spacing.space8,
      padding: spacing.space16,
    },
    featureCategory: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
    },
    featureTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.space8,
    },
    featureTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 18,
      lineHeight: 24,
      flexShrink: 1,
    },
    featureDescription: {
      ...typography.small,
      color: colors.textSecondary,
    },
    eventsEmpty: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
}
