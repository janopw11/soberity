import { eventCalendarUri } from './eventsApi';

export async function downloadCalendar(id: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(eventCalendarUri(id), { signal: controller.signal, cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('text/calendar')) throw new Error('Calendar unavailable');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');anchor.href = url;anchor.download = `soberity-${id}.ics`;
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } finally { clearTimeout(timeout); }
}
