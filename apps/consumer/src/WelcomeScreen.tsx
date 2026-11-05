import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@soberity/design-tokens';
import { Screen } from './ui';
import { DailySpotlight } from './DailySpotlight';
import { ChapterHeading } from './ChapterHeading';
import WeeklyScienceCard from './discovery/WeeklyScienceCard';
import { NearbyEvents } from './events/NearbyEvents';
import { CurrentEventLocation } from './events/CurrentEventLocation';

/** Member-only home, mounted by the authenticated route group. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const [revealTicket, setRevealTicket] = useState(false);
  const animationPlayed = useRef(false);
  useFocusEffect(
    useCallback(() => {
      animationPlayed.current = false;
      setRevealTicket(true);
      return () => setRevealTicket(false);
    }, []),
  );

  return (
    <Screen maxWidth={800}>
      <CurrentEventLocation />
      <NearbyEvents
        reveal={revealTicket}
        animationPlayed={animationPlayed}
      />
      <WeeklyScienceCard />
      <View style={styles.section}>
        <ChapterHeading icon="sun">{t('home.todaysSpotlight')}</ChapterHeading>
        <DailySpotlight />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ section: { gap: spacing.space16 } });
