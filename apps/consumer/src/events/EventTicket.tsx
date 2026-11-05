import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

import { SettingsIcon } from '../ui';
import { eventImageUri, type DiscoveryEvent } from './eventsApi';

/** Real Home ticket. Preserve the approved image/stub geometry and first-ticket reduced-motion animation. */
export function EventTicket({
  event,
  reveal,
  animationPlayed,
  showPreview = false,
  compactBadges = false,
  testID = 'nearby-ticket',
}: {
  event: DiscoveryEvent;
  reveal: boolean;
  animationPlayed: RefObject<boolean>;
  showPreview?: boolean;
  compactBadges?: boolean;
  testID?: string;
}) {
  const { t, i18n } = useTranslation();
  const photograph = event.cover_id
    ? { uri: eventImageUri(event.cover_id) }
    : null;
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB';
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timezone,
  }).format(new Date(event.starts_at));
  const dateParts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: event.timezone,
  }).formatToParts(new Date(event.starts_at));
  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? '';
  const currentYear = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    timeZone: event.timezone,
  }).format(new Date());
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: event.timezone,
  }).format(new Date(event.starts_at));
  const compactDate = `${datePart('day')} ${datePart('month').replace(/\./g, '').toLocaleUpperCase(locale)}${datePart('year') === currentYear ? '' : ` ${datePart('year')}`} · ${time}`;
  const accessibleDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: event.timezone,
  }).format(new Date(event.starts_at));
  const status = event.status ?? (showPreview ? 'PREVIEW' : 'PUBLISHED');
  const city =
    i18n.resolvedLanguage === 'pl'
      ? (event.city_pl ?? event.city)
      : (event.city_en ?? event.city);
  const { colors } = useThemePreferences();
  const progress = useRef(new Animated.Value(0)).current;
  const played = animationPlayed;
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [size, setSize] = useState({ width: 0, height: 180 });
  const [stubWidth, setStubWidth] = useState(0);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {
        if (active) setReducedMotion(true);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (reducedMotion) {
      progress.stopAnimation();
      progress.setValue(1);
      return;
    }
    if (
      !reveal ||
      reducedMotion === null ||
      played.current ||
      !size.width ||
      !stubWidth
    )
      return;
    played.current = true;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.5,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(600),
      Animated.timing(progress, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => {
      animation.stop();
      progress.setValue(1);
    };
  }, [reveal, reducedMotion, progress, size.width, stubWidth, played]);
  useFocusEffect(
    useCallback(
      () => () => {
        if (played.current) {
          progress.stopAnimation();
          progress.setValue(1);
        }
      },
      [progress],
    ),
  );
  const keyframes = [0, 0.16, 0.5, 0.76, 1];
  const animatedStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: keyframes,
          outputRange: [0, -1, 10, 7, 0],
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: keyframes,
          outputRange: [0, -1, 5, 3, 0],
        }),
      },
      {
        rotate: progress.interpolate({
          inputRange: keyframes,
          outputRange: ['0deg', '-1deg', '4deg', '3deg', '0deg'],
        }),
      },
    ],
    opacity: progress.interpolate({
      inputRange: keyframes,
      outputRange: [1, 1, 0.88, 0.94, 1],
    }),
  };
  return (
    <Link href={{ pathname: '/events/[id]', params: { id: event.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={[
          event.title,
          compactBadges ? accessibleDate : date,
          compactBadges ? t(`events.badgeStatus.${status}`) : event.timezone,
          city,
        ]
          .filter(Boolean)
          .join(', ')}
        testID={testID}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={StyleSheet.flatten([
          styles.ticket,
          {
            borderWidth: 2,
            borderColor: focused ? colors.focusRing : 'transparent',
            borderRadius: radii.sm,
            opacity: pressed ? 0.94 : 1,
          },
        ])}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize((previous) =>
            previous.width === width && previous.height === height
              ? previous
              : { width, height },
          );
        }}
      >
        <View
          style={[
            styles.main,
            compactBadges && styles.mainWithoutStub,
            { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
          ]}
        >
          {size.width > 0 && photograph && !failed ? (
            <Image
              onError={() => setFailed(true)}
              source={photograph}
              resizeMode="cover"
              accessible={false}
              style={[styles.photo, { width: size.width, height: size.height }]}
            />
          ) : null}
          <View
            style={[
              styles.mainContent,
              { backgroundColor: colors.eventImageScrim },
            ]}
          >
            <View style={compactBadges ? styles.badgeRow : undefined}>
              <View
                style={[styles.category, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.categoryText, { color: colors.onPrimary }]}
                >
                  {t(`events.categories.${event.category_code}`)}
                </Text>
              </View>
              {compactBadges ? (
                <>
                  <View
                    style={[
                      styles.dateBadge,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Text
                      accessibilityLabel={accessibleDate}
                      style={[styles.dateText, { color: colors.primary }]}
                    >
                      {compactDate}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            status === 'CANCELLED'
                              ? colors.danger
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {t(`events.badgeStatus.${status}`)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
            {!photograph || failed ? (
              <View accessible={false}>
                <SettingsIcon
                  name="calendar"
                  color={colors.eventImageText}
                  size={24}
                />
              </View>
            ) : null}
            <View style={styles.copy}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: colors.eventImageText }]}
              >
                {event.title}
              </Text>
              <Text style={[styles.location, { color: colors.eventImageText }]}>
                {[event.venue_name, city, event.country_code]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {showPreview && !compactBadges ? (
                <Text
                  style={[styles.location, { color: colors.eventImageText }]}
                >
                  {date} · {event.timezone}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {compactBadges ? null : (
          <Animated.View
            onLayout={(event) => setStubWidth(event.nativeEvent.layout.width)}
            style={[
              styles.stub,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
              },
              animatedStyle,
            ]}
          >
            {size.width > 0 && photograph && !failed ? (
              <Image
                onError={() => setFailed(true)}
                source={photograph}
                resizeMode="cover"
                accessible={false}
                style={[
                  styles.photo,
                  {
                    left: -(size.width - stubWidth),
                    width: size.width,
                    height: size.height,
                  },
                ]}
              />
            ) : null}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.eventImageScrim },
              ]}
            />
            <View
              style={[
                styles.stubContent,
                { backgroundColor: colors.eventImageScrim },
              ]}
            >
              <View
                style={[styles.stamp, { borderColor: colors.eventImageText }]}
              >
                <Text
                  style={[styles.preview, { color: colors.eventImageText }]}
                >
                  {showPreview ? t('events.ticketPreview') : date}
                </Text>
              </View>
              {showPreview ? null : (
                <Text style={[styles.zone, { color: colors.eventImageText }]}>
                  {event.timezone}
                </Text>
              )}
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Link>
  );
}
const styles = StyleSheet.create({
  ticket: {
    width: '100%',
    minHeight: 180,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  main: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: radii.sm,
    borderBottomLeftRadius: radii.sm,
    overflow: 'hidden',
  },
  photo: { position: 'absolute', left: 0, top: 0 },
  mainWithoutStub: {
    borderRightWidth: 1,
    borderTopRightRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.space8,
  },
  dateBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.space8,
    paddingVertical: spacing.space4,
    maxWidth: '100%',
  },
  dateText: { ...typography.caption, fontWeight: '600' },
  statusBadge: {
    marginLeft: 'auto',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.space8,
    paddingVertical: spacing.space4,
    maxWidth: '100%',
  },
  statusText: { ...typography.caption },
  mainContent: {
    flex: 1,
    padding: spacing.space16,
    justifyContent: 'space-between',
    gap: spacing.space16,
  },
  category: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: radii.pill,
    paddingVertical: spacing.space4 / 2,
    paddingHorizontal: spacing.space8,
  },
  categoryText: {
    ...typography.caption,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  copy: { gap: spacing.space8 },
  title: { ...typography.h2 },
  location: { ...typography.small },
  stub: {
    width: '24%',
    maxWidth: 144,
    borderWidth: 1,
    borderTopRightRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
    overflow: 'hidden',
  },
  stubContent: { flex: 1, padding: spacing.space12, justifyContent: 'center' },
  stamp: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.space12,
  },
  preview: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  zone: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.space8,
  },
});
