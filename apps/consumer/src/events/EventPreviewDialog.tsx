import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import type { DiscoveryEvent } from './eventsApi';
import { directionUrls, type PreciseCoordinates } from './mapModel';

type Props = {
  event: DiscoveryEvent & PreciseCoordinates;
  locale: 'en' | 'pl';
  onClose: () => void;
};

/** Compact card shown over the native map when a marker is tapped: title, date and three actions. */
export default function EventPreviewDialog({ event, locale, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemePreferences();
  const urls = directionUrls({
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.title,
  });
  const when = new Date(event.starts_at).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timezone,
  });
  return (
    <View
      accessibilityLabel={event.title}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.primary }]}
          >
            {event.title}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{when}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('events.map.close')}
          onPress={onClose}
          style={[
            styles.close,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.closeLabel, { color: colors.primary }]}>×</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push({ pathname: '/events/[id]', params: { id: event.id } })
        }
        style={[
          styles.button,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
          {t('events.map.viewDetails')}
        </Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(urls.google)}
          style={[
            styles.button,
            styles.half,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: colors.primary }]}>
            {t('events.map.googleMaps')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(urls.apple)}
          style={[
            styles.button,
            styles.half,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: colors.primary }]}>
            {t('events.map.appleMaps')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 68,
    bottom: 12,
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 15, lineHeight: 19, fontWeight: '700' },
  date: { fontSize: 13 },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  closeLabel: { fontSize: 20, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  button: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  buttonLabel: { fontSize: 14, fontWeight: '600' },
});
