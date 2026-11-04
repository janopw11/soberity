import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

// Owner-provided preview; not an actual published event or ticket for sale.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro static asset
const photograph = require('../../assets/images/schonbrunn-vienna-preview.jpeg');

/** Only Home's first preview receives reveal=true. The stub tears and settles once per mount. */
export function EventTicketPreview({ reveal }: { reveal: boolean }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const progress = useRef(new Animated.Value(0)).current;
  const played = useRef(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [size, setSize] = useState({ width: 0, height: 180 });
  const [stubWidth, setStubWidth] = useState(0);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReducedMotion(value); }).catch(() => { if (active) setReducedMotion(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (reducedMotion) { progress.stopAnimation(); progress.setValue(1); return; }
    if (!reveal || reducedMotion === null || played.current || !size.width || !stubWidth) return;
    played.current = true;
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.5, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(600),
      Animated.timing(progress, {
        toValue: 1, duration: 500, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [reveal, reducedMotion, progress, size.width, stubWidth]);
  useFocusEffect(useCallback(() => () => {
    if (played.current) { progress.stopAnimation(); progress.setValue(1); }
  }, [progress]));
  const keyframes = [0, 0.16, 0.5, 0.76, 1];
  const animatedStyle = {
    transform: [
      { translateX: progress.interpolate({ inputRange: keyframes, outputRange: [0, -1, 10, 7, 0] }) },
      { translateY: progress.interpolate({ inputRange: keyframes, outputRange: [0, -1, 5, 3, 0] }) },
      { rotate: progress.interpolate({ inputRange: keyframes, outputRange: ['0deg', '-1deg', '4deg', '3deg', '0deg'] }) },
    ],
    opacity: progress.interpolate({ inputRange: keyframes, outputRange: [1, 1, 0.88, 0.94, 1] }),
  };
  return <View style={styles.ticket} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    <View style={[styles.main, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
      {size.width > 0 ? <Image source={photograph} resizeMode="cover" accessible={false} style={[styles.photo, { width: size.width, height: size.height }]} /> : null}
      <View style={[styles.mainContent, { backgroundColor: colors.eventImageScrim }]}>
        <View style={[styles.category, { backgroundColor: colors.primary }]}>
          <Text style={[styles.categoryText, { color: colors.onPrimary }]}>{t('home.viennaRave.category')}</Text>
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.eventImageText }]}>{t('home.viennaRave.title')}</Text>
          <Text style={[styles.location, { color: colors.eventImageText }]}>{t('home.viennaRave.location')}</Text>
        </View>
      </View>
    </View>
    <Animated.View onLayout={event => setStubWidth(event.nativeEvent.layout.width)} style={[
      styles.stub, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, animatedStyle,
    ]}>
      {size.width > 0 ? <Image source={photograph} resizeMode="cover" accessible={false} style={[styles.photo, { left: -(size.width - stubWidth), width: size.width, height: size.height }]} /> : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.eventImageScrim }]} />
      <View style={[styles.stubContent, { backgroundColor: colors.eventImageScrim }]}>
        <View style={[styles.stamp, { borderColor: colors.eventImageText }]}>
          <Text style={[styles.preview, { color: colors.eventImageText }]}>{t('home.viennaRave.ticketPreview')}</Text>
        </View>
      </View>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  ticket: { width: '100%', minHeight: 180, flexDirection: 'row', alignItems: 'stretch' },
  main: { flex: 1, minWidth: 0, borderWidth: 1, borderRightWidth: 0, borderTopLeftRadius: radii.sm, borderBottomLeftRadius: radii.sm, overflow: 'hidden' },
  photo: { position: 'absolute', left: 0, top: 0 },
  mainContent: { flex: 1, padding: spacing.space16, justifyContent: 'space-between', gap: spacing.space16 },
  category: { alignSelf: 'flex-start', maxWidth: '100%', borderRadius: radii.pill, paddingVertical: spacing.space4 / 2, paddingHorizontal: spacing.space8 },
  categoryText: { ...typography.caption, letterSpacing: 0.2, textTransform: 'uppercase' },
  copy: { gap: spacing.space8 }, title: { ...typography.h2 }, location: { ...typography.small },
  stub: { width: '24%', maxWidth: 144, borderWidth: 1, borderTopRightRadius: radii.sm, borderBottomRightRadius: radii.sm, overflow: 'hidden' },
  stubContent: { flex: 1, padding: spacing.space12, justifyContent: 'center' },
  stamp: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: spacing.space12 },
  preview: { ...typography.caption, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center', textTransform: 'uppercase' },
});
