import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';
import { useEventLocation } from './EventLocationContext';

/** One current, approximate display value; never a saved position or a manual search filter. */
export function CurrentEventLocation() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { enabled, currentLocation } = useEventLocation();
  if (!enabled) return null;
  const polish = i18n.resolvedLanguage === 'pl';
  const place = currentLocation?.place;
  const placeLabel = place
    ? [
        polish
          ? place.label_pl || place.label_en
          : place.label_en || place.label_pl,
        polish
          ? place.country_label_pl || place.country_label_en
          : place.country_label_en || place.country_label_pl,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
  const resolved = currentLocation?.location;
  const geoCity = resolved?.city
    ? [resolved.city, resolved.country].filter(Boolean).join(', ')
    : '';
  const label =
    geoCity ||
    resolved?.address ||
    placeLabel ||
    t('events.currentLocation.unknown');
  return (
    <View
      style={styles.row}
      testID="events-current-location"
      accessibilityLiveRegion="polite"
    >
      <SettingsIcon name="location" color={colors.primary} size={18} />
      <View style={styles.copy}>
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          {t('events.currentLocation.label')}
        </Text>
        <Text style={[styles.location, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
  },
  copy: { flex: 1, minWidth: 0 },
  caption: { ...typography.caption },
  location: { ...typography.small },
});
