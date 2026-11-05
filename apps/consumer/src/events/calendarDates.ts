/** Calendar days in the viewer's timezone; end is exclusive on the server. */
export const DATE_PRESETS = [
  'any',
  'today',
  'tomorrow',
  'weekend',
  'next7',
  'custom',
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export function calendarDay(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** This weekend is Saturday–Sunday; on Sunday it includes the current weekend. */
export function presetCalendarRange(
  preset: Exclude<DatePreset, 'custom'>,
  now = new Date(),
) {
  if (preset === 'any') return { from: '', to: '' };
  const from = new Date(now);
  from.setHours(12, 0, 0, 0);
  if (preset === 'tomorrow') from.setDate(from.getDate() + 1);
  if (preset === 'weekend')
    from.setDate(
      from.getDate() + (from.getDay() === 0 ? -1 : 6 - from.getDay()),
    );
  const to = new Date(from);
  if (preset === 'weekend') to.setDate(to.getDate() + 1);
  if (preset === 'next7') to.setDate(to.getDate() + 6);
  return { from: calendarDay(from), to: calendarDay(to) };
}

export function dateBoundary(
  value: string,
  exclusiveEnd = false,
): string | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year!, month! - 1, day!);
  date.setHours(0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month! - 1 ||
    date.getDate() !== day
  )
    throw new Error('Invalid date');
  if (exclusiveEnd) date.setDate(date.getDate() + 1);
  return date.toISOString();
}
