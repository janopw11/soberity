import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useEventLocation } from './EventLocationContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, SettingsGroup } from '../ui';

export function EventLocationSettings() {
  const { t } = useTranslation(),
    { colors } = useThemePreferences();
  const { enabled, requesting, declined, enable, disable } = useEventLocation();
  return (
    <SettingsGroup>
      <View style={styles.content}>
        <Text
          accessibilityRole="header"
          style={{ ...typography.bodyStrong, color: colors.primary }}
        >
          {t('events.locationSettings.title')}
        </Text>
        <Text style={{ ...typography.small, color: colors.textSecondary }}>
          {t('events.locationSettings.description')}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...typography.small, color: colors.textSecondary }}
        >
          {t(
            enabled
              ? 'events.locationSettings.enabled'
              : 'events.locationSettings.disabled',
          )}
        </Text>
        {declined ? (
          <Alert
            variant="info"
            message={t('events.locationSettings.declined')}
          />
        ) : null}
        {!enabled ? (
          <Button
            variant="secondary"
            testID="events-location-enable"
            label={t('events.locationSettings.enable')}
            loading={requesting}
            onPress={() => {
              void enable();
            }}
          />
        ) : null}
        {enabled || requesting ? (
          <Button
            variant="tertiary"
            testID="events-location-disable"
            label={t('events.locationSettings.disable')}
            onPress={disable}
          />
        ) : null}
        {declined && Platform.OS !== 'web' ? (
          <Button
            variant="tertiary"
            label={t('events.locationSettings.system')}
            onPress={() => {
              void Linking.openSettings().catch(() => undefined);
            }}
          />
        ) : null}
      </View>
    </SettingsGroup>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.space12, padding: spacing.space16 },
});
