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

import { prepareEventFilters } from './eventFilters';
import { presetCalendarRange } from './calendarDates';

describe('date presets and applying filter drafts', () => {
  const friday = new Date(2026, 10, 6, 23, 30);
  it('resolves local dates, current Saturday-Sunday and seven inclusive days', () => {
    expect(presetCalendarRange('any', friday)).toEqual({ from: '', to: '' });
    expect(presetCalendarRange('today', friday)).toEqual({
      from: '2026-11-06',
      to: '2026-11-06',
    });
    expect(presetCalendarRange('tomorrow', friday)).toEqual({
      from: '2026-11-07',
      to: '2026-11-07',
    });
    expect(presetCalendarRange('weekend', friday)).toEqual({
      from: '2026-11-07',
      to: '2026-11-08',
    });
    expect(presetCalendarRange('weekend', new Date(2026, 10, 8))).toEqual({
      from: '2026-11-07',
      to: '2026-11-08',
    });
    expect(presetCalendarRange('next7', friday)).toEqual({
      from: '2026-11-06',
      to: '2026-11-12',
    });
    expect(presetCalendarRange('tomorrow', new Date(2026, 11, 31))).toEqual({
      from: '2027-01-01',
      to: '2027-01-01',
    });
  });
  it('resolves on apply, trims names, deduplicates categories and leaves the draft intact', () => {
    const draft = {
      ...initialEventFilters,
      name: '  RaVe  ',
      category: 'SOBER_RAVE, SOBER_RAVE,',
      datePreset: 'today' as const,
    };
    const applied = prepareEventFilters(draft, friday);
    expect(applied).toMatchObject({
      name: 'RaVe',
      category: 'SOBER_RAVE',
      from: '2026-11-06',
      to: '2026-11-06',
    });
    expect(draft.from).toBe('');
    expect(
      new URLSearchParams(eventFilterQuery(initialEventFilters)).get(
        'dateScope',
      ),
    ).toBe('ANY');
    expect(
      new URLSearchParams(eventFilterQuery(applied)).has('dateScope'),
    ).toBe(false);
  });
  it('requires complete valid custom bounds', () => {
    for (const dates of [
      { from: '', to: '' },
      { from: '2026-11-06', to: '' },
      { from: '2026-02-30', to: '2026-03-01' },
      { from: '2026-11-08', to: '2026-11-06' },
    ]) {
      expect(() =>
        prepareEventFilters({
          ...initialEventFilters,
          ...dates,
          datePreset: 'custom',
        }),
      ).toThrow();
    }
  });
  it('uses calendar increments across both Vienna DST transitions', () => {
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
        `import {presetCalendarRange,dateBoundary} from ${JSON.stringify(modulePath)}; console.log(JSON.stringify([new Date(2029,2,25),new Date(2029,9,28)].map(now=>{const r=presetCalendarRange('today',now);return Date.parse(dateBoundary(r.to,true))-Date.parse(dateBoundary(r.from));})));`,
      ],
      { env: { ...process.env, TZ: 'Europe/Vienna' }, encoding: 'utf8' },
    );
    expect(JSON.parse(result)).toEqual([23 * 3600000, 25 * 3600000]);
  });
});
