import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';

import { Screen } from './ui';
import { DailySpotlight } from './DailySpotlight';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import DiscoverScreen from './science/DiscoverScreen';
import { ReadingText } from './science/readingUi';

// Owner-provided preview photograph. Preserve the original and crop in the viewport.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const viennaRaveImage = require('../assets/images/schonbrunn-vienna-preview.jpeg');

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { width } = useWindowDimensions();
  const imageHeight = Math.min(180, Math.max(150, width * 0.45));
  const styles = createStyles(colors, imageHeight);
  const [eventViewportWidth, setEventViewportWidth] = useState(0);
  const eventWidth = eventViewportWidth || Math.max(1, Math.min(800, width - spacing.space32) - 2);
  // 704 × 435 original. Bias the crop toward the palace, below the skyline.
  const eventPhotoHeight = Math.max(imageHeight, eventWidth * 435 / 704);
  const eventPhotoWidth = eventPhotoHeight * 704 / 435;

  return (
    <Screen maxWidth={800}>
      <View style={styles.section}>
        <ReadingText heading>{t('home.todaysSpotlight')}</ReadingText>
        <DailySpotlight />
      </View>

      <View style={styles.section}>
        <ReadingText heading>{t('home.eventsNearYou')}</ReadingText>
        <View style={[styles.tile, styles.featureCard]}>
          <View
            style={{ height: imageHeight, overflow: 'hidden' }}
            onLayout={event => {
              const measuredWidth = event.nativeEvent?.layout?.width;
              if (typeof measuredWidth === 'number' && Number.isFinite(measuredWidth) && measuredWidth > 0) {
                setEventViewportWidth(measuredWidth);
              }
            }}
          >
            <Image
              source={viennaRaveImage}
              accessibilityLabel={t('home.viennaRave.imageAlt')}
              resizeMode="cover"
              fadeDuration={0}
              style={{
                position: 'absolute',
                width: eventPhotoWidth,
                height: eventPhotoHeight,
                left: (eventWidth - eventPhotoWidth) / 2,
                top: -(eventPhotoHeight - imageHeight) * 0.64,
              }}
            />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureCategory}>{t('home.viennaRave.preview')}</Text>
            <Text accessibilityRole="header" style={styles.featureTitle}>{t('home.viennaRave.title')}</Text>
            <Text style={styles.featureDescription}>{t('home.viennaRave.location')}</Text>
          </View>
        </View>
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
    section: { gap: spacing.space16 },
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
  });
}
