/** Calendar days in the viewer's timezone; end is exclusive on the server. */
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
