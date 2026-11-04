import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';

import { Screen } from './ui';
import { DailySpotlight } from './DailySpotlight';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import DiscoverScreen from './science/DiscoverScreen';
import { ChapterHeading } from './ChapterHeading';

// Owner-provided preview photograph. Preserve the original and crop in the viewport.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const viennaRaveImage = require('../assets/images/schonbrunn-vienna-preview.jpeg');

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  return (
    <Screen maxWidth={800}>
      <View style={styles.section}>
        <ChapterHeading>{t('home.todaysSpotlight')}</ChapterHeading>
        <DailySpotlight />
      </View>

      <View style={styles.section}>
        <ChapterHeading>{t('home.eventsNearYou')}</ChapterHeading>
        <ImageBackground
          source={viennaRaveImage}
          resizeMode="cover"
          style={styles.featureCard}
          imageStyle={styles.ticketImage}
        >
          <View style={styles.ticketOverlay}>
            <View style={styles.featureContent}>
              <View style={styles.categoryPill}>
                <Text style={styles.featureCategory}>{t('home.viennaRave.category')}</Text>
              </View>
              <Text accessibilityRole="header" style={styles.featureTitle}>{t('home.viennaRave.title')}</Text>
              <Text style={styles.featureDescription}>{t('home.viennaRave.location')}</Text>
            </View>
            <View style={styles.ticketStub}>
              <View style={styles.ticketStamp}>
                <Text style={styles.ticketStubLabel}>{t('home.viennaRave.ticketPreview')}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <DiscoverScreen compact />
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    section: { gap: spacing.space16 },
    featureCard: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    ticketImage: { borderRadius: radii.sm },
    ticketOverlay: {
      minHeight: 180,
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.eventImageScrim,
    },
    ticketStub: {
      width: '24%',
      maxWidth: 144,
      justifyContent: 'center',
      padding: spacing.space12,
      borderLeftWidth: 1,
      borderColor: colors.eventImageText,
      backgroundColor: colors.eventImageScrim,
    },
    ticketStamp: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.eventImageText,
      paddingVertical: spacing.space12,
    },
    ticketStubLabel: {
      ...typography.caption,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: colors.eventImageText,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    featureContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'flex-end',
      gap: spacing.space8,
      padding: spacing.space16,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      marginBottom: 'auto',
      borderRadius: radii.pill,
      paddingVertical: spacing.space4 / 2,
      paddingHorizontal: spacing.space8,
      backgroundColor: colors.primary,
    },
    featureCategory: {
      ...typography.caption,
      color: colors.onPrimary,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    featureTitle: {
      ...typography.h2,
      color: colors.eventImageText,
      flexShrink: 1,
    },
    featureDescription: {
      ...typography.small,
      color: colors.eventImageText,
    },
  });
}
