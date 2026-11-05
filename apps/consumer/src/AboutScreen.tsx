import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Screen, SettingsIcon } from './ui';
import type { SettingsIconName } from './ui/SettingsIcon';
import { LocationAttribution } from './events/LocationSelect';

/** Reduced motion is the safe initial state until the platform preference is known. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

function Entrance({
  children,
  reduced,
}: PropsWithChildren<{ reduced: boolean }>) {
  const progress = useRef(new Animated.Value(1)).current;
  useFocusEffect(
    useCallback(() => {
      progress.setValue(reduced ? 1 : 0);
      const motion = Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : 420,
        useNativeDriver: Platform.OS !== 'web',
      });
      motion.start();
      return () => motion.stop();
    }, [progress, reduced]),
  );
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function ExploreLink({
  area,
  quiet = false,
}: {
  area: 'science' | 'events';
  quiet?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Link href={area === 'science' ? '/science' : '/events'} asChild>
      <Pressable
        accessibilityRole="link"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.link,
          {
            backgroundColor: quiet
              ? 'transparent'
              : pressed
                ? colors.primaryPressed
                : colors.primary,
            borderColor: focused ? colors.focusRing : 'transparent',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.linkLabel,
            { color: quiet ? colors.primary : colors.onPrimary },
          ]}
        >
          {t(`about.explore.${area}`)}
        </Text>
        <SettingsIcon
          name="arrowUpRight"
          size={18}
          color={quiet ? colors.primary : colors.onPrimary}
        />
      </Pressable>
    </Link>
  );
}

function Pillar({
  area,
  index,
  reduced,
}: {
  area: 'science' | 'events';
  index: string;
  reduced: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.pillar, { borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t(`about.pillars.${area}.title`)}
        onPress={() => setExpanded((value) => !value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.pillarControl,
          {
            borderColor: focused ? colors.focusRing : 'transparent',
            backgroundColor: pressed ? colors.listSurface : 'transparent',
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
          {index}
        </Text>
        <SettingsIcon
          name={area === 'science' ? 'flask' : 'people'}
          size={24}
          color={colors.primary}
        />
        <View style={styles.pillarCopy}>
          <Text style={[styles.pillarTitle, { color: colors.textPrimary }]}>
            {t(`about.pillars.${area}.title`)}
          </Text>
          <Text style={[styles.small, { color: colors.textSecondary }]}>
            {t(`about.pillars.${area}.summary`)}
          </Text>
        </View>
        <SettingsIcon
          name={expanded ? 'chevronDown' : 'chevron'}
          size={18}
          color={colors.primary}
        />
      </Pressable>
      {expanded ? (
        <Entrance reduced={reduced}>
          <View style={styles.pillarDetails}>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t(`about.pillars.${area}.details`)}
            </Text>
            <ExploreLink area={area} quiet />
          </View>
        </Entrance>
      ) : null}
    </View>
  );
}

/** An optional abstract brand illustration, not a scientific or neurological model. */
function ClarityMoment({ reduced }: { reduced: boolean }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [clear, setClear] = useState(false);
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: clear ? 1 : 0,
      duration: reduced ? 0 : 650,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [clear, reduced, progress]);
  return (
    <View style={[styles.clarity, { backgroundColor: colors.listSurface }]}>
      <View style={styles.sectionCopy}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { color: colors.textPrimary }]}
        >
          {t('about.clarity.title')}
        </Text>
        <Text style={[styles.small, { color: colors.textSecondary }]}>
          {t('about.clarity.copy')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          clear ? 'about.clarity.reset' : 'about.clarity.action',
        )}
        accessibilityState={{ selected: clear }}
        onPress={() => setClear((value) => !value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.clarityButton,
          { borderColor: focused ? colors.focusRing : 'transparent' },
        ]}
      >
        <View
          style={styles.particles}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const x = (i % 4) * 40,
              y = Math.floor(i / 4) * 32;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i % 3 === 0 ? colors.primary : colors.border,
                    transform: [
                      {
                        translateX: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [((i * 53) % 157) - 8, x],
                        }),
                      },
                      {
                        translateY: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [((i * 37) % 101) - 8, y],
                        }),
                      },
                      {
                        rotate: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [`${i * 23}deg`, '0deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.linkLabel, { color: colors.primary }]}>
          {t(clear ? 'about.clarity.reset' : 'about.clarity.action')}
        </Text>
      </Pressable>
      <Text style={[styles.caption, { color: colors.textMuted }]}>
        {t('about.clarity.note')}
      </Text>
    </View>
  );
}

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const reduced = useReducedMotion();
  const principles: { key: string; icon: SettingsIconName }[] = [
    { key: 'evidence', icon: 'book' },
    { key: 'freedom', icon: 'sun' },
    { key: 'together', icon: 'people' },
  ];
  return (
    <Screen maxWidth={800}>
      <View style={styles.page}>
        <Entrance reduced={reduced}>
          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {t('about.kicker')}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.heroTitle, { color: colors.textPrimary }]}
            >
              {t('about.heroTitle')}
            </Text>
            <View style={[styles.rule, { backgroundColor: colors.primary }]} />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t('about.heroCopy')}
            </Text>
            <View style={styles.heroTags}>
              <Text style={[styles.small, { color: colors.primary }]}>
                {t('about.scienceTag')}
              </Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>+</Text>
              <Text style={[styles.small, { color: colors.primary }]}>
                {t('about.eventsTag')}
              </Text>
            </View>
          </View>
        </Entrance>
        <View style={styles.sectionCopy}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.textPrimary }]}
          >
            {t('about.pillars.title')}
          </Text>
          <Pillar area="science" index="01" reduced={reduced} />
          <Pillar area="events" index="02" reduced={reduced} />
        </View>
        <ClarityMoment reduced={reduced} />
        <View style={styles.sectionCopy}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.textPrimary }]}
          >
            {t('about.principlesTitle')}
          </Text>
          {principles.map(({ key, icon }) => (
            <View
              key={key}
              style={[styles.principle, { borderColor: colors.border }]}
            >
              <SettingsIcon name={icon} size={22} color={colors.primary} />
              <View style={styles.pillarCopy}>
                <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                  {t(`about.principles.${key}.title`)}
                </Text>
                <Text style={[styles.small, { color: colors.textSecondary }]}>
                  {t(`about.principles.${key}.copy`)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.closing, { backgroundColor: colors.surfaceAlt }]}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.textPrimary }]}
          >
            {t('about.closingTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('about.closingCopy')}
          </Text>
          <View style={styles.actions}>
            <ExploreLink area="science" />
            <ExploreLink area="events" quiet />
          </View>
        </View>
        <View style={[styles.credits, { borderColor: colors.border }]}>
          <Text
            accessibilityRole="header"
            style={[styles.linkLabel, { color: colors.textSecondary }]}
          >
            {t('about.creditsTitle')}
          </Text>
          <LocationAttribution />
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  page: { gap: spacing.space32, paddingBottom: spacing.space16 },
  hero: { gap: spacing.space16, paddingVertical: spacing.space24 },
  heroTitle: { ...typography.display, maxWidth: 560 },
  eyebrow: { ...typography.label },
  body: { ...typography.body, maxWidth: 600 },
  small: { ...typography.small },
  caption: { ...typography.caption },
  rule: { width: 48, height: 3, borderRadius: radii.pill },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space12 },
  heading: { ...typography.h2 },
  sectionCopy: { gap: spacing.space12 },
  pillar: { borderBottomWidth: StyleSheet.hairlineWidth },
  pillarControl: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space12,
    paddingVertical: spacing.space12,
    paddingHorizontal: spacing.space4,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  pillarCopy: { flex: 1, minWidth: 0, gap: spacing.space4 },
  pillarTitle: { ...typography.bodyStrong },
  pillarDetails: {
    gap: spacing.space8,
    paddingBottom: spacing.space12,
    paddingHorizontal: spacing.space8,
  },
  link: {
    minHeight: 48,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space8,
    paddingHorizontal: spacing.space16,
    paddingVertical: spacing.space8,
    borderWidth: 2,
    borderRadius: radii.pill,
  },
  linkLabel: { ...typography.label, flexShrink: 1 },
  clarity: {
    padding: spacing.space24,
    borderRadius: radii.xl,
    gap: spacing.space12,
  },
  clarityButton: {
    alignItems: 'center',
    gap: spacing.space16,
    padding: spacing.space16,
    borderWidth: 2,
    borderRadius: radii.lg,
  },
  particles: { width: 176, height: 112 },
  dot: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 12,
    height: 12,
    borderRadius: radii.sm,
  },
  principle: {
    flexDirection: 'row',
    gap: spacing.space16,
    paddingVertical: spacing.space12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closing: {
    padding: spacing.space24,
    gap: spacing.space16,
    borderRadius: radii.xl,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.space8,
  },
  credits: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.space16,
    gap: spacing.space8,
  },
});
