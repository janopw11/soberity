import { describe, expect, it } from '@jest/globals';
import { eventFilterQuery, initialEventFilters } from './eventFilters';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
describe('event filter contract', () => {
  it('encodes combined ID/type/name/date filters without deprecated or location parameters', () => {
    const params = new URLSearchParams(
      eventFilterQuery({
        name: '  Dance & coffee  ',
        countryId: 'country-id',
        cityId: 'city-id',
        category: 'SOBER_RAVE',
        from: '2029-03-25',
        to: '2029-03-25',
      }),
    );
    expect(params.get('q')).toBe('Dance & coffee');
    expect(params.get('countryId')).toBe('country-id');
    expect(params.get('cityId')).toBe('city-id');
    expect([...params.keys()].sort()).toEqual([
      'category',
      'cityId',
      'countryId',
      'from',
      'q',
      'to',
    ]);
  });
  it('accepts a same-day range, rejects impossible and reversed dates and requires country for city', () => {
    expect(() =>
      eventFilterQuery({
        ...initialEventFilters,
        from: '2029-05-01',
        to: '2029-05-01',
      }),
    ).not.toThrow();
    for (const patch of [
      { from: '2029-02-30' },
      { from: '2029-05-02', to: '2029-05-01' },
      { cityId: 'city' },
    ])
      expect(() =>
        eventFilterQuery({ ...initialEventFilters, ...patch }),
      ).toThrow();
  });
  it('uses local next-midnight rather than adding 24 hours across DST', () => {
    const modulePath = pathToFileURL(
      resolve(__dirname, 'calendarDates.ts'),
    ).href;
    const result = execFileSync(
      process.execPath,
      [
        '--no-warnings',
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `import { dateBoundary } from ${JSON.stringify(modulePath)}; console.log(JSON.stringify(['2029-03-25','2029-10-28'].map(day => Date.parse(dateBoundary(day,true))-Date.parse(dateBoundary(day)))));`,
      ],
      { env: { ...process.env, TZ: 'Europe/Vienna' }, encoding: 'utf8' },
    );
    expect(JSON.parse(result)).toEqual([23 * 3600000, 25 * 3600000]);
  });
});
