import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { getEventInterest } from './eventInterestsApi';
import { EventTicket } from './EventTicket';
import type { DiscoveryEvent } from './eventsApi';

/** Use the Home ticket presentation without catalog-specific visual overrides. */
export function EventCard({ event }: { event: DiscoveryEvent }) {
  const animationPlayed = useRef(true);
  const { status, user, getIdToken } = useAuthStatus();
  const uid = status === 'authenticated' ? user?.uid : undefined;
  const [interest, setInterest] = useState<{
    uid: string;
    eventId: string;
    declared: boolean;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setInterest(null);
      if (uid) {
        void (async () => {
          try {
            const token = await getIdToken();
            if (!token || !active) return;
            const declared = await getEventInterest(event.id, token);
            if (active) setInterest({ uid, eventId: event.id, declared });
          } catch {
            // Unknown state must never look like a confirmed declaration.
            if (active) setInterest(null);
          }
        })();
      }
      return () => {
        active = false;
      };
    }, [uid, event.id, getIdToken]),
  );
  const going = Boolean(
    uid && interest?.uid === uid && interest.eventId === event.id && interest.declared,
  );
  return (
    <EventTicket
      event={event}
      going={going}
      reveal={false}
      animationPlayed={animationPlayed}
      testID="event-ticket"
    />
  );
}
