import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui';
import { eventImageUri, type DiscoveryEvent } from './eventsApi';

/** Discovery summary only. Event detail/navigation is introduced in P2-I03. */
export function EventCard({ event, category }: { event: DiscoveryEvent; category: string }) {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB';
  const nightlife = event.category_code === 'SOBER_PARTY' || event.category_code === 'SOBER_RAVE';
  const date = (value: string) => {
    try { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: event.timezone }).format(new Date(value)); }
    catch { return value; }
  };
  let price = t('events.priceUnknown');
  if (event.price_kind === 'FREE') price = t('events.free');
  else if (event.price_kind === 'PAID' && event.currency && event.price_minor !== null) {
    try {
      const format = new Intl.NumberFormat(locale, { style: 'currency', currency: event.currency });
      price = format.format(event.price_minor / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
    } catch { price = t('events.priceUnknown'); }
  }
  return <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
    <View style={[styles.picture, { backgroundColor: colors.surfaceAlt }]}>
      {event.cover_id && failedImage !== event.cover_id ? <Image source={{ uri: eventImageUri(event.cover_id) }} style={StyleSheet.absoluteFill} resizeMode="cover"
        accessibilityLabel={event.cover_alt_text ?? event.title} onError={() => setFailedImage(event.cover_id)} />
        : <View accessible={false}><SettingsIcon name="calendar" color={colors.primary} size={40} /></View>}
    </View>
    <View style={styles.content}>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: nightlife ? colors.primary : colors.surfaceAlt }]}>
          <Text style={[styles.caption, { color: nightlife ? colors.onPrimary : colors.primary }]}>{category}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.caption, { color: colors.primary }]}>{t(event.alcohol_policy === 'ALCOHOL_FREE' ? 'events.alcoholFree' : 'events.soberFriendly')}</Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>
      <View style={styles.dateRow}>
        <View accessible={false}><SettingsIcon name="calendar" color={colors.primary} size={20} /></View>
        <View style={styles.flex}>
          <Text style={[styles.small, { color: colors.textSecondary }]}>{date(event.starts_at)} — {date(event.ends_at)}</Text>
          <Text style={[styles.caption, { color: colors.textMuted }]}>{event.timezone}</Text>
        </View>
      </View>
      <Text style={[styles.small, { color: colors.textSecondary }]}>{[event.venue_name, event.city, event.region, event.country_code].filter(Boolean).join(' · ')}</Text>
      <Text style={[styles.caption, { color: colors.textMuted }]}>{t('events.organizedBy', { name: event.organizer_name })}</Text>
      <View style={[styles.footer, { borderColor: colors.border }]}>
        <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
        {event.availability !== 'UNKNOWN' ? <Text style={[styles.caption, { color: event.availability === 'SOLD_OUT' ? colors.warning : colors.textSecondary }]}>{t(`events.availability.${event.availability}`)}</Text> : null}
      </View>
      {event.accessibility !== 'UNKNOWN' ? <Text style={[styles.caption, { color: colors.textSecondary }]}>{t(`events.accessibilityValues.${event.accessibility}`)}</Text> : null}
      {event.locale !== (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en') ? <Text style={[styles.caption, { color: colors.textMuted }]}>{t(`events.contentLanguage.${event.locale}`)}</Text> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden', width: '100%' },
  picture: { aspectRatio: 16 / 7.5, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.space16, gap: spacing.space8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 },
  badge: { borderRadius: radii.pill, paddingHorizontal: spacing.space8, paddingVertical: spacing.space4, maxWidth: '100%' },
  caption: { ...typography.caption }, title: { ...typography.h3 }, small: { ...typography.small },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space8 }, flex: { flex: 1, minWidth: 0 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.space8, marginTop: spacing.space4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space8 },
  price: { ...typography.bodyStrong },
});
