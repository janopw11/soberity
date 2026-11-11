import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Button, SettingsIcon } from '../ui';
import type { SettingsIconName } from '../ui/SettingsIcon';
import { eventImageUri } from './eventsApi';

export function EventBackButton({
  onPress,
  overImage = false,
}: {
  onPress: () => void;
  overImage?: boolean;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const foreground = overImage ? colors.eventImageText : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('navigation.goBack')}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.back,
        {
          backgroundColor: overImage
            ? colors.eventImageScrim
            : colors.surfaceAlt,
          borderColor: focused
            ? foreground
            : overImage
              ? colors.eventImageScrim
              : colors.surfaceAlt,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.backArrow}>
        <SettingsIcon name="chevron" color={foreground} size={24} />
      </View>
    </Pressable>
  );
}
export function EventHero({
  coverId,
  alt,
  onBack,
}: {
  coverId: string | null;
  alt: string;
  onBack: () => void;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    setFailed(false);
  }, [coverId]);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <View
      testID="event-detail-hero"
      style={[
        styles.hero,
        {
          height: Math.min(480, Math.max(280, width * 0.82)),
          backgroundColor: colors.surfaceAlt,
        },
      ]}
    >
      {coverId && !failed ? (
        <Image
          source={{ uri: eventImageUri(coverId) }}
          accessibilityLabel={alt}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={reduceMotion ? 0 : 180}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.imageFallback}>
          <SettingsIcon name="people" size={48} color={colors.primary} />
          <Text style={[styles.fallbackLabel, { color: colors.textSecondary }]}>
            {t('events.detail.imageUnavailable')}
          </Text>
        </View>
      )}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="event-hero-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0.6"
                stopColor={colors.background}
                stopOpacity="0"
              />
              <Stop
                offset="1"
                stopColor={colors.background}
                stopOpacity="0.5"
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#event-hero-fade)" />
        </Svg>
      </View>
      <View style={styles.heroNavigation}>
        <EventBackButton
          onPress={onBack}
          overImage={Boolean(coverId && !failed)}
        />
      </View>
    </View>
  );
}

/** A compact fact row. Labels describe data rather than implying absent features. */
export function EventInfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: SettingsIconName;
  label?: string | undefined;
  value: string;
  detail?: string | undefined;
}) {
  const { colors } = useThemePreferences();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceAlt }]}>
        <SettingsIcon name={icon} color={colors.primary} size={22} />
      </View>
      <View style={styles.infoText}>
        {label ? (
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ) : null}
        <Text
          selectable
          style={[styles.infoValue, { color: colors.textPrimary }]}
        >
          {value}
        </Text>
        {detail ? (
          <Text
            selectable
            style={[styles.infoDetail, { color: colors.textSecondary }]}
          >
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
export function EventSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const { colors } = useThemePreferences();
  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textPrimary }]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
export function EventOrganizer({
  name,
  description,
  verified,
}: {
  name: string;
  description?: string | undefined;
  verified?: boolean;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  return (
    <View style={[styles.organizer, { backgroundColor: colors.listSurface }]}>
      <View
        style={[styles.organizerIcon, { backgroundColor: colors.surfaceAlt }]}
      >
        <SettingsIcon name="people" color={colors.primary} size={24} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {t('events.detail.hostedBy')}
        </Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
          {name}
        </Text>
        {description ? (
          <Text style={[styles.infoDetail, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
        {verified ? (
          <Text style={[styles.infoDetail, { color: colors.success }]}>
            {t('events.detail.verifiedOrganizer')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
/** Fixed in the screen's flex layout, outside the ScrollView, so it never covers its content. */
export function EventActionBar({
  label,
  busy,
  onPress,
  notice,
  variant = 'primary',
}: {
  label?: string | undefined;
  busy: boolean;
  onPress: () => void;
  notice?: string | undefined;
  variant?: 'primary' | 'secondary';
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  return (
    <View
      testID="event-detail-action-bar"
      style={[
        styles.actionBar,
        { backgroundColor: colors.surface, borderTopColor: colors.surfaceAlt },
      ]}
    >
      <View style={styles.actionInner}>
        {!label ? (
          <View style={styles.actionText}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('events.detail.stayCurious')}
            </Text>
            <Text style={[styles.actionHost, { color: colors.textPrimary }]}>
              {notice ?? t('events.detail.noPage')}
            </Text>
          </View>
        ) : null}
        {label ? (
          <Button
            label={label}
            variant={variant}
            disabled={busy}
            onPress={onPress}
            style={styles.primaryAction}
          />
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: { width: '100%', overflow: 'hidden' },
  heroNavigation: {
    position: 'absolute',
    top: spacing.space16,
    left: spacing.space16,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { transform: [{ rotate: '180deg' }] },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space12,
  },
  fallbackLabel: { ...typography.small },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.space16,
    alignItems: 'flex-start',
    paddingVertical: spacing.space12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, minWidth: 0, gap: spacing.space4 },
  infoLabel: { ...typography.caption },
  infoValue: { ...typography.bodyStrong },
  infoDetail: { ...typography.small },
  section: { gap: spacing.space16 },
  sectionTitle: { ...typography.h3 },
  organizer: {
    padding: spacing.space16,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.space16,
    alignItems: 'flex-start',
  },
  organizerIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.space16,
    paddingVertical: spacing.space12,
  },
  actionInner: {
    width: '100%',
    maxWidth: 912,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space16,
  },
  actionText: { flex: 1, minWidth: 0, gap: spacing.space4 },
  actionHost: { ...typography.small },
  primaryAction: { minHeight: 52, width: '100%', maxWidth: 360, flexShrink: 1 },
});
