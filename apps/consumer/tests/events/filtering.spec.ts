import { expect, test, type Page } from '@playwright/test';
import { install, country, city } from './fixtures';

const text = (language: string) => ({
  name: language === 'pl' ? 'Nazwa wydarzenia' : 'Event name',
  location: language === 'pl' ? 'Lokalizacja' : 'Location',
  show: language === 'pl' ? 'Pokaż wydarzenia' : 'Show Events',
  reset: language === 'pl' ? 'Wyczyść' : 'Reset',
  dates: language === 'pl' ? /^Termin:/ : /^Dates:/,
  category: language === 'pl' ? /^Kategoria:/ : /^Category:/,
  all: language === 'pl' ? 'Wszystkie' : 'All Events',
  music: language === 'pl' ? 'Muzyka' : 'Music',
});
const open = (page: Page) => page.getByTestId('events-open-filters').click();
const query = (queries: URL[]) => queries.at(-1)!.searchParams;

for (const language of ['en', 'pl'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`combined name city category date filters and pagination ${language} ${theme}`, async ({
      page,
    }, info) => {
      const state = await install(page, language, theme),
        labels = text(language);
      await page.clock.setFixedTime(new Date('2026-11-06T11:00:00Z'));
      await page.goto('/events');
      await expect(
        page.getByText(
          language === 'pl' ? 'Brak wydarzeń' : 'No events found',
          { exact: true },
        ),
      ).toBeVisible();
      expect(state.queries).toHaveLength(1);
      await expect(page.getByTestId('events-applied-filters')).toHaveCount(0);
      await open(page);
      const modal = page.getByTestId('events-filters-dialog');
      await page
        .getByRole('textbox', { name: labels.name, exact: true })
        .fill('  RAVE & coffee  ');
      const originalSize = await modal.boundingBox();
      await page
        .getByRole('textbox', { name: labels.location, exact: true })
        .fill('vie');
      await expect(
        page.getByRole('button', { name: /^(Vienna|Wiedeń), Austria$/ }),
      ).toBeVisible();
      const expandedSize = await modal.boundingBox();
      expect(
        Math.abs(expandedSize!.height - originalSize!.height),
      ).toBeLessThanOrEqual(1);
      await expect(
        modal.getByText(/Location data:|Dane lokalizacji:/),
      ).toHaveCount(0);
      await page
        .getByRole('button', { name: /^(Vienna|Wiedeń), Austria$/ })
        .click();
      await page.getByRole('button', { name: labels.category }).click();
      await page
        .getByRole('checkbox', { name: 'Sober rave', exact: true })
        .click();
      await page.getByRole('button', { name: labels.dates }).click();
      await page
        .getByRole('radio', {
          name: language === 'pl' ? 'Jutro' : 'Tomorrow',
          exact: true,
        })
        .click();
      expect(state.queries).toHaveLength(1);
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect(modal).toBeHidden();
      await expect(
        page.getByRole('link', { name: /Filtered event page 1/ }),
      ).toBeVisible();
      expect(state.queries).toHaveLength(2);
      expect(query(state.queries).get('q')).toBe('RAVE & coffee');
      expect(query(state.queries).get('countryId')).toBe(country.id);
      expect(query(state.queries).get('cityId')).toBe(city.id);
      expect(query(state.queries).get('category')).toBe('SOBER_RAVE');
      expect(query(state.queries).get('from')).toBe('2026-11-06T23:00:00.000Z');
      expect(query(state.queries).get('to')).toBe('2026-11-07T23:00:00.000Z');
      await expect(
        page.getByText(
          language === 'pl' ? /1 wydarzenie|13 wydarzeń/ : /13 events/,
        ),
      ).toBeVisible();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Następna' : 'Next',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('link', { name: /Filtered event page 2/ }),
      ).toBeVisible();
      expect(query(state.queries).get('page')).toBe('1');
      expect(query(state.queries).get('cityId')).toBe(city.id);
      await page
        .getByRole('button', { name: labels.music, exact: true })
        .click();
      await expect(
        page.getByRole('link', { name: /Filtered event page 1/ }),
      ).toBeVisible();
      expect(query(state.queries).get('category')).toBe(
        'SOBER_PARTY,SOBER_RAVE,DANCE,LIVE_MUSIC',
      );
      expect(query(state.queries).get('q')).toBe('RAVE & coffee');
      expect(query(state.queries).get('cityId')).toBe(city.id);
      expect(query(state.queries).get('from')).toBe('2026-11-06T23:00:00.000Z');
      await open(page);
      await expect(
        page.getByRole('textbox', { name: labels.location, exact: true }),
      ).toHaveValue(language === 'pl' ? 'Wiedeń, Austria' : 'Vienna, Austria');
      await page.getByRole('button', { name: labels.category }).click();
      await expect(
        page.getByRole('checkbox', { name: 'Sober party', exact: true }),
      ).toBeChecked();
      await page.keyboard.press('Escape');
      await expect(modal).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: 'Sober party', exact: true }),
      ).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`filtering-${language}-${theme}.png`),
        fullPage: true,
      });
    });

    test(`date presets and custom range validation ${language} ${theme}`, async ({
      page,
    }, info) => {
      const state = await install(page, language, theme),
        labels = text(language);
      await page.clock.setFixedTime(new Date('2026-11-06T11:00:00Z'));
      await page.goto('/events');
      await expect(page.getByTestId('events-open-filters')).toBeVisible();
      const presets = [
        [
          'Today',
          'Dzisiaj',
          '2026-11-05T23:00:00.000Z',
          '2026-11-06T23:00:00.000Z',
        ],
        [
          'Tomorrow',
          'Jutro',
          '2026-11-06T23:00:00.000Z',
          '2026-11-07T23:00:00.000Z',
        ],
        [
          'This weekend',
          'Ten weekend',
          '2026-11-06T23:00:00.000Z',
          '2026-11-08T23:00:00.000Z',
        ],
        [
          'Next 7 days',
          'Najbliższe 7 dni',
          '2026-11-05T23:00:00.000Z',
          '2026-11-12T23:00:00.000Z',
        ],
        ['Any date', 'Dowolny termin', null, null],
      ];
      for (const [en, pl, from, to] of presets) {
        await open(page);
        await page.getByRole('button', { name: labels.dates }).click();
        await page
          .getByRole('radio', {
            name: (language === 'pl' ? pl : en)!,
            exact: true,
          })
          .click();
        const count = state.queries.length;
        await page
          .getByRole('button', { name: labels.show, exact: true })
          .click();
        await expect.poll(() => state.queries.length).toBe(count + 1);
        expect(query(state.queries).get('from')).toBe(from);
        expect(query(state.queries).get('to')).toBe(to);
        expect(query(state.queries).get('dateScope')).toBe('UPCOMING');
      }
      await open(page);
      await page.getByRole('button', { name: labels.dates }).click();
      await page
        .getByRole('radio', {
          name: language === 'pl' ? 'Własny zakres dat' : 'Custom date range',
          exact: true,
        })
        .click();
      const count = state.queries.length;
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect(
        page.getByText(
          language === 'pl'
            ? /Wybierz poprawny zakres dat/
            : /Choose a valid date range/,
        ),
      ).toBeVisible();
      expect(state.queries).toHaveLength(count);
      await page
        .getByRole('button', {
          name:
            language === 'pl' ? /^Własny zakres dat:/ : /^Custom date range:/,
        })
        .click();
      const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
      for (const day of [7, 9])
        await page
          .getByRole('button', {
            name: new Date(2026, 10, day).toLocaleDateString(locale, {
              dateStyle: 'full',
            }),
            exact: true,
          })
          .click();
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect
        .poll(() => query(state.queries).get('from'))
        .toBe('2026-11-06T23:00:00.000Z');
      expect(query(state.queries).get('to')).toBe('2026-11-09T23:00:00.000Z');
      await open(page);
      await expect(
        page.getByRole('button', {
          name:
            language === 'pl' ? /^Własny zakres dat:/ : /^Custom date range:/,
        }),
      ).toHaveAccessibleName(/2026/);
      await page.screenshot({
        path: info.outputPath(`date-filter-${language}-${theme}.png`),
        fullPage: true,
      });
    });

    test(`draft reset cancellation country selection and errors ${language} ${theme}`, async ({
      page,
    }) => {
      const state = await install(page, language, theme),
        labels = text(language);
      await page.goto('/events');
      await page
        .getByRole('button', { name: labels.music, exact: true })
        .click();
      await open(page);
      await page
        .getByRole('textbox', { name: labels.name, exact: true })
        .fill('Coffee');
      await page
        .getByRole('textbox', { name: labels.location, exact: true })
        .fill('Austria');
      await page.getByRole('button', { name: 'Austria', exact: true }).click();
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect(
        page.getByRole('link', { name: /Filtered event page 1/ }),
      ).toBeVisible();
      expect(query(state.queries).get('countryId')).toBe(country.id);
      expect(query(state.queries).has('cityId')).toBe(false);
      await open(page);
      const count = state.queries.length;
      await page
        .getByRole('button', { name: labels.reset, exact: true })
        .click();
      await expect(
        page.getByRole('textbox', { name: labels.name, exact: true }),
      ).toHaveValue('');
      await expect(
        page.getByRole('textbox', { name: labels.location, exact: true }),
      ).toHaveValue('');
      expect(state.queries).toHaveLength(count);
      await page
        .getByRole('textbox', { name: labels.name, exact: true })
        .focus();
      await page.keyboard.press('Escape');
      await open(page);
      await expect(
        page.getByRole('textbox', { name: labels.name, exact: true }),
      ).toHaveValue('Coffee');
      await expect(
        page.getByRole('textbox', { name: labels.location, exact: true }),
      ).toHaveValue('Austria');
      await page
        .getByRole('button', { name: labels.reset, exact: true })
        .click();
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: labels.all, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByText(
          language === 'pl' ? 'Brak wydarzeń' : 'No events found',
          { exact: true },
        ),
      ).toBeVisible();
      expect(query(state.queries).has('category')).toBe(false);
      expect(query(state.queries).has('countryId')).toBe(false);
      state.setMode('error');
      await open(page);
      await page
        .getByRole('textbox', { name: labels.name, exact: true })
        .fill('Retry');
      await page
        .getByRole('button', { name: labels.show, exact: true })
        .click();
      await expect(
        page.getByText(
          language === 'pl'
            ? 'Nie udało się wczytać wydarzeń. Spróbuj ponownie.'
            : 'We could not load events. Please try again.',
          { exact: true },
        ),
      ).toBeVisible();
      state.setMode('results');
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Spróbuj ponownie' : 'Try again',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('link', { name: /Filtered event page 1/ }),
      ).toBeVisible();
      expect(query(state.queries).get('q')).toBe('Retry');
    });
  }
