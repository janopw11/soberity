import { useRef } from 'react';
import { EventTicket } from './EventTicket';
import type { DiscoveryEvent } from './eventsApi';

/** Use the Home ticket presentation without catalog-specific visual overrides. */
export function EventCard({ event }: { event: DiscoveryEvent }) {
  const animationPlayed = useRef(true);
  return (
    <EventTicket
      event={event}
      reveal={false}
      animationPlayed={animationPlayed}
      testID="event-ticket"
    />
  );
}
