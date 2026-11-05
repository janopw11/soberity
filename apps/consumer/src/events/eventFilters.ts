import { dateBoundary } from './eventsApi';
export type EventFilters = {
  name: string;
  countryId: string;
  cityId: string;
  category: string;
  from: string;
  to: string;
};
export const initialEventFilters: EventFilters = {
  name: '',
  countryId: '',
  cityId: '',
  category: '',
  from: '',
  to: '',
};
/** Range is local calendar days, including the whole final day (DST-safe next midnight). */
export function eventFilterQuery(input: EventFilters): string {
  const from = dateBoundary(input.from),
    to = dateBoundary(input.to, true);
  if (input.from && input.to && input.from > input.to)
    throw new Error('Invalid date range');
  if (to && !from && new Date(to).getTime() <= Date.now())
    throw new Error('A past range needs a start');
  if (input.cityId && !input.countryId) throw new Error('Country required');
  const params = new URLSearchParams();
  if (input.name.trim()) params.set('q', input.name.trim());
  if (input.countryId) params.set('countryId', input.countryId);
  if (input.cityId) params.set('cityId', input.cityId);
  if (input.category) params.set('category', input.category);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return params.toString();
}
