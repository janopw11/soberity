import { Linking } from 'react-native';
import { eventCalendarUri } from './eventsApi';

/** Opens an ICS attachment/import flow without requesting access to the user's calendars. */
export async function downloadCalendar(id: string): Promise<void> {
  await Linking.openURL(eventCalendarUri(id));
}
