import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useEventLocation } from './EventLocationContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Button, SettingsGroup, SettingsIcon } from '../ui';

export function EventLocationSettings() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { enabled, requesting, declined, saving, consentError, retryConsent, enable, disable } = useEventLocation();
  const [switchFocused, setSwitchFocused] = useState(false);
  return (
    <>
      <SettingsGroup>
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <SettingsIcon name="location" color={colors.primary} size={22} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('events.locationSettings.switchLabel')}
              </Text>
            </View>
            {requesting || saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
            <View
              style={[
                styles.switchTarget,
                {
                  borderColor: switchFocused ? colors.focusRing : 'transparent',
                },
              ]}
            >
              <Switch
                disabled={saving}
                value={enabled || requesting}
                onValueChange={(allow) => {
                  if (!allow) disable();
                  else if (!enabled && !requesting) void enable();
                }}
                accessibilityLabel={t('events.locationSettings.switchLabel')}
                accessibilityHint={t('events.locationSettings.sessionHint')}
                accessibilityState={{ busy: requesting }}
                testID="events-location-consent"
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={
                  enabled || requesting ? colors.onPrimary : colors.surface
                }
                ios_backgroundColor={colors.surfaceAlt}
                onFocus={() => setSwitchFocused(true)}
                onBlur={() => setSwitchFocused(false)}
              />
            </View>
          </View>
          {consentError ? (
            <View>
              <Text accessibilityRole="alert" style={[styles.description, { color: colors.danger }]}>
                {t('events.locationSettings.saveError')}
              </Text>
              <Button variant="tertiary" label={t('events.retry')} onPress={retryConsent} disabled={saving} />
            </View>
          ) : null}
          {declined ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.description, { color: colors.textMuted }]}
            >
              {t('events.locationSettings.declined')}
            </Text>
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
    </>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: spacing.space4,
    paddingHorizontal: spacing.space16,
    paddingVertical: 0,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space4,
  },
  labelGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space16,
  },
  label: { ...typography.body, flex: 1 },
  switchTarget: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.space4,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: { ...typography.caption },
});
