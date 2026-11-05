import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { Screen } from './ui';
import { DailySpotlight } from './DailySpotlight';
import { ChapterHeading } from './ChapterHeading';
import WeeklyScienceCard from './discovery/WeeklyScienceCard';
import { NearbyEvents } from './events/NearbyEvents';

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const [revealTicket, setRevealTicket] = useState(false);
  const seen = useRef(false);
  const animationPlayed = useRef(false);
  const homeFocused = useRef(true);
  const visibility = useRef({
    sectionY: 0,
    ticketY: 0,
    ticketHeight: 0,
    offsetY: 0,
    height: 0,
    scrolled: false,
  });
  const visibilityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateVisibility = useCallback(() => {
    if (seen.current || !homeFocused.current) return;
    const value = visibility.current;
    const top = value.sectionY + value.ticketY + spacing.space8;
    const visibleHeight = Math.max(
      0,
      Math.min(top + value.ticketHeight, value.offsetY + value.height) -
        Math.max(top, value.offsetY),
    );
    const visible =
      value.scrolled &&
      value.ticketHeight > 0 &&
      value.height > 0 &&
      visibleHeight >= Math.min(value.ticketHeight * 0.6, value.height * 0.6);
    if (!visible && visibilityTimer.current !== null) {
      clearTimeout(visibilityTimer.current);
      visibilityTimer.current = null;
    }
    if (visible && visibilityTimer.current === null)
      visibilityTimer.current = setTimeout(() => {
        seen.current = true;
        setRevealTicket(true);
        visibilityTimer.current = null;
      }, 180);
  }, []);
  useFocusEffect(
    useCallback(() => {
      homeFocused.current = true;
      updateVisibility();
      return () => {
        homeFocused.current = false;
        if (visibilityTimer.current !== null)
          clearTimeout(visibilityTimer.current);
        visibilityTimer.current = null;
      };
    }, [updateVisibility]),
  );
  useEffect(
    () => () => {
      if (visibilityTimer.current !== null)
        clearTimeout(visibilityTimer.current);
    },
    [],
  );

  return (
    <Screen
      maxWidth={800}
      onViewportChange={(viewport) => {
        visibility.current.offsetY = viewport.offsetY;
        visibility.current.height = viewport.height;
        visibility.current.scrolled = viewport.scrolled;
        updateVisibility();
      }}
    >
      <WeeklyScienceCard />
      <View style={styles.section}>
        <ChapterHeading icon="sun">{t('home.todaysSpotlight')}</ChapterHeading>
        <DailySpotlight />
      </View>

      <NearbyEvents
        reveal={revealTicket}
        animationPlayed={animationPlayed}
        onSectionLayout={(event) => {
          visibility.current.sectionY = event.nativeEvent.layout.y;
          updateVisibility();
        }}
        onTicketLayout={(event) => {
          visibility.current.ticketY = event.nativeEvent.layout.y;
          visibility.current.ticketHeight = event.nativeEvent.layout.height;
          updateVisibility();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ section: { gap: spacing.space16 } });
