import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { directionUrls, type PreciseCoordinates } from './mapModel';

type Props = PreciseCoordinates & {
  title: string;
  onClose: () => void;
};

/** Asks which map app should open the event location. Opened from Event Details on iOS and Android. */
export default function DirectionsChooser({
  title,
  latitude,
  longitude,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const urls = directionUrls({ latitude, longitude, title });
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => undefined}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.heading, { color: colors.primary }]}>
              {t('events.map.chooserTitle')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('events.map.close')}
              onPress={onClose}
              style={[
                styles.close,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.closeLabel, { color: colors.primary }]}>
                ×
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(urls.google)}
            style={[
              styles.button,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
              {t('events.map.googleMaps')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(urls.apple)}
            style={[
              styles.button,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
              {t('events.map.appleMaps')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 320,
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heading: { flex: 1, fontSize: 15, fontWeight: '700' },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  closeLabel: { fontSize: 20, lineHeight: 22 },
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
