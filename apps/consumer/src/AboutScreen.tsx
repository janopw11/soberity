import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Screen, SettingsIcon } from './ui';
import { ReadingCard, ReadingText } from './science/readingUi';
import { LocationAttribution } from './events/LocationSelect';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <Screen maxWidth={800}>
      <View style={styles.intro}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.primary }]}
        >
          {t('about.mission')}
        </Text>
        <ReadingText>{t('about.description')}</ReadingText>
      </View>
      <ReadingCard>
        <View accessible={false}>
          <SettingsIcon name="book" size={28} color={colors.primary} />
        </View>
        <ReadingText heading>{t('about.scienceTitle')}</ReadingText>
        <ReadingText muted>{t('about.science')}</ReadingText>
      </ReadingCard>
      <ReadingCard>
        <View accessible={false}>
          <SettingsIcon name="people" size={28} color={colors.primary} />
        </View>
        <ReadingText heading>{t('about.communityTitle')}</ReadingText>
        <ReadingText muted>{t('about.community')}</ReadingText>
      </ReadingCard>
      <ReadingText muted>{t('about.approach')}</ReadingText>
      <LocationAttribution />
    </Screen>
  );
}
const styles = StyleSheet.create({
  intro: { gap: spacing.space12 },
  title: { ...typography.h2 },
});
