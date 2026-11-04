import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppState, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Dialog, SettingsIcon } from './ui';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro static assets */
const features = [
  { id: 'brain', light: require('../assets/images/brain-icon-ocean.png'), dark: require('../assets/images/brain-icon-ocean.png') },
  { id: 'myths', light: require('../assets/images/myths-icon-light.png'), dark: require('../assets/images/myths-icon-dark.png') },
  { id: 'map', light: require('../assets/images/map-icon-light.png'), dark: require('../assets/images/map-icon-dark.png') },
  { id: 'community', light: require('../assets/images/community-icon-light.png'), dark: require('../assets/images/community-icon-dark.png') },
] as const;
/* eslint-enable @typescript-eslint/no-require-imports */

// Use local calendar days, not elapsed hours: DST changes must not skip a feature.
function dailyIndex() {
  const now = new Date();
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const anchor = Date.UTC(2026, 10, 4);
  return ((Math.floor((day - anchor) / 86400000) % features.length) + features.length) % features.length;
}

export function DailySpotlight() {
  const { t } = useTranslation();
  const { colors, theme } = useThemePreferences();
  const [index, setIndex] = useState(dailyIndex);
  const [preview, setPreview] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const refresh = useCallback(() => { setIndex(dailyIndex()); setPreview(false); }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(() => { refresh(); schedule(); }, midnight.getTime() - now.getTime());
    }
    schedule();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { clearTimeout(timer); refresh(); schedule(); }
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [refresh]);
  const feature = features[index]!;
  const title = t(`home.spotlight.${feature.id}.title`);
  const description = t(`home.spotlight.${feature.id}.description`);
  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint={t('home.spotlight.previewHint')}
      onPress={() => setPreview(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      testID="home-for-you-today"
      style={({ pressed }) => [styles.card, {
        backgroundColor: pressed || hovered ? colors.surfaceAlt : colors.surface,
        borderColor: focused ? colors.focusRing : colors.border,
        borderStyle: focused ? 'dashed' : 'solid',
      }]}
    >
      <View style={[styles.art, { backgroundColor: colors.surfaceAlt }]}>
        <Image source={feature[theme]} style={styles.image} resizeMode="contain" accessible={false} accessibilityIgnoresInvertColors importantForAccessibility="no" />
      </View>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        <Text style={[styles.status, { color: colors.textMuted }]}>{t('common.notAvailableYetBadge')}</Text>
      </View>
      <View style={styles.arrow} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SettingsIcon name="chevron" size={20} color={colors.primary} />
      </View>
    </Pressable>
    <Dialog visible={preview} title={title} closeLabel={t('navigation.close')} onClose={() => setPreview(false)}>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{t('home.spotlight.unavailable')}</Text>
    </Dialog>
  </>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 128, borderRadius: radii.lg, borderWidth: 2, overflow: 'hidden' },
  art: { width: '25%', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', padding: spacing.space12 },
  image: { width: '100%', height: 96 },
  content: { flex: 1, minWidth: 0, padding: spacing.space16, gap: spacing.space8 },
  title: { ...typography.h3 },
  description: { ...typography.small },
  status: { ...typography.caption },
  arrow: { paddingRight: spacing.space12 },
});
