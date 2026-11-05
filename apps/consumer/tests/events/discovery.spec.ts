import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
const picture = readFileSync(
  new URL(
    '../../assets/images/schonbrunn-vienna-preview.jpeg',
    import.meta.url,
  ),
);
const country = {
  id: '10000000-0000-4000-8000-000000000001',
  geoname_id: 1,
  name: 'Austria',
  label: 'Austria',
  label_en: 'Austria',
  label_pl: 'Austria',
};
const poland = {
  ...country,
  id: '10000000-0000-4000-8000-000000000002',
  geoname_id: 2,
  name: 'Poland',
  label: 'Poland',
  label_en: 'Poland',
  label_pl: 'Polska',
};
const city = {
  id: '20000000-0000-4000-8000-000000000001',
  geoname_id: 101,
  name: 'Wien',
  label: 'Vienna',
  label_en: 'Vienna',
  label_pl: 'Wiedeń',
  region: 'Vienna',
  district: null,
};
const event = {
  id: '30000000-0000-4000-8000-000000000001',
  title: 'Synthetic sober rave',
  description: 'Synthetic event fixture for UI acceptance.',
  locale: 'en',
  category_code: 'SOBER_RAVE',
  track: 'SOBER_NIGHTLIFE',
  alcohol_policy: 'ALCOHOL_FREE',
  starts_at: '2029-11-06T19:00:00Z',
  ends_at: null,
  timezone: 'Europe/Vienna',
  city: 'Wien',
  city_en: 'Vienna',
  city_pl: 'Wiedeń',
  region: 'Vienna',
  country_code: 'AT',
  country_id: country.id,
  city_id: city.id,
  venue_name: 'Synthetic venue',
  address: '',
  price_kind: 'UNKNOWN',
  price_minor: null,
  currency: null,
  accessibility: 'UNKNOWN',
  availability: 'UNKNOWN',
  cover_id: '40000000-0000-4000-8000-000000000001',
  cover_alt_text: 'Synthetic fixture picture',
  coordinate_source: 'CITY',
  distance_km: 5,
  organizer_url: 'https://example.test/event',
  status: 'PUBLISHED',
  alcohol_rules: 'No alcohol',
  beverage_notes: '0.0% only',
  accessibility_notes: null,
  entry_rules: '',
};
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
};
async function install(page: Page, language = 'en', theme = 'light') {
  const queries: URL[] = [],
    nearby: { url: string; body: Record<string, unknown> }[] = [];
  let mode: 'results' | 'empty' | 'error' = 'results';
  await page.addInitScript(
    ({ language, theme }) => {
      localStorage.setItem('@soberity/preferences/language', language);
      localStorage.setItem('@soberity/preferences/theme', theme);
    },
    { language, theme },
  );
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    if (url.pathname.includes('/media/')) {
      await route.fulfill({
        headers: { ...cors, 'Content-Type': 'image/jpeg' },
        body: picture,
      });
      return;
    }
    let value: unknown;
    if (url.pathname === '/api/v1/identity/me')
      value = { uid: 'events-browser', emailVerified: true };
    else if (url.pathname === '/api/v1/me')
      value = {
        id: 'events-browser',
        displayName: 'Fixture member',
        city: null,
        interests: [],
        locale: language,
        updatedAt: new Date().toISOString(),
      };
    else if (url.pathname === '/api/v1/editorial/me') value = { roles: [] };
    else if (url.pathname === '/api/v1/discover/weekly/current')
      value = { article: null, fallback: false };
    else if (url.pathname === '/api/v1/science/categories') value = [];
    else if (url.pathname === '/api/v1/locations/countries')
      value = {
        items: [country, poland].filter((item) =>
          `${item.label_en} ${item.label_pl}`
            .toLowerCase()
            .includes((url.searchParams.get('q') ?? '').toLowerCase()),
        ),
        page: 0,
        size: 20,
        total: 2,
      };
    else if (url.pathname === '/api/v1/locations/cities') {
      expect(url.searchParams.get('countryId')).toBe(country.id);
      value = { items: [city], page: 0, size: 20, total: 1 };
    } else if (url.pathname === '/api/v1/events/nearby') {
      expect(request.method()).toBe('POST');
      expect(url.search).toBe('');
      nearby.push({
        url: url.href,
        body: request.postDataJSON() as Record<string, unknown>,
      });
      if (mode === 'error') {
        await route.fulfill({ status: 503, headers: cors, json: {} });
        return;
      }
      value = {
        items:
          mode === 'empty'
            ? []
            : [
                event,
                {
                  ...event,
                  id: '30000000-0000-4000-8000-000000000002',
                  title: 'Synthetic coffee meetup',
                  category_code: 'COFFEE_MEETUP',
                  distance_km: 20,
                },
              ],
        page: 0,
        size: 3,
        total: mode === 'empty' ? 0 : 2,
        radiusKm: 100,
      };
    } else if (url.pathname === '/api/v1/events') {
      queries.push(url);
      const count = url.searchParams.has('q') ? 13 : 0,
        page = Number(url.searchParams.get('page') ?? 0);
      value = {
        items: count
          ? [{ ...event, title: `Filtered event page ${page + 1}` }]
          : [],
        page,
        size: 12,
        total: count,
      };
    } else if (url.pathname.startsWith('/api/v1/events/')) value = event;
    else {
      await route.fulfill({ status: 404, headers: cors, json: {} });
      return;
    }
    await route.fulfill({ headers: cors, json: value });
  });
  return {
    queries,
    nearby,
    setMode: (value: typeof mode) => {
      mode = value;
    },
  };
}
async function login(page: Page) {
  const uid = 'events-browser';
  const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email: 'events@example.test', email_verified: true, aud: 'demo-soberity', iss: 'https://securetoken.google.com/demo-soberity', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'password' } })).toString('base64url')}.test-only`;
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    await route.fulfill({
      headers: cors,
      json: route.request().url().includes('accounts:lookup')
        ? {
            users: [
              {
                localId: uid,
                email: 'events@example.test',
                emailVerified: true,
                passwordUpdatedAt: 0,
                lastLoginAt: String(Date.now()),
                createdAt: String(Date.now()),
              },
            ],
          }
        : {
            localId: uid,
            email: 'events@example.test',
            idToken: token,
            refreshToken: 'test-refresh',
            expiresIn: '3600',
            registered: true,
          },
    });
  });
  await page.goto('/sign-in');
  await page
    .getByTestId('sign-in-email')
    .getByRole('textbox')
    .fill('events@example.test');
  await page
    .getByTestId('sign-in-password')
    .getByRole('textbox')
    .fill('Events-Test-2026!');
  await page.getByTestId('sign-in-submit').click();
  await expect(
    page.getByRole('heading', { name: /Weekly Science Drop|Artykuł tygodnia/ }),
  ).toBeVisible();
}
for (const language of ['en', 'pl'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`country-city name/type/date filters and pagination ${language} ${theme}`, async ({
      page,
    }, info) => {
      const state = await install(page, language, theme);
      await page.goto('/events');
      await expect(page.getByTestId('events-cities')).toBeDisabled();
      await page.getByTestId('events-countries').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('events-countries-dialog')).toBeVisible();
      await page.getByTestId('events-countries-dialog-close').focus();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('events-countries-dialog')).toBeHidden();
      await page.getByTestId('events-countries').click();
      const search = page.getByRole('textbox', {
        name: language === 'pl' ? 'Szukaj kraju' : 'Search countries',
      });
      await search.fill('aus');
      await page.getByRole('radio', { name: 'Austria', exact: true }).click();
      await page.getByTestId('events-cities').click();
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Szukaj miasta' : 'Search cities',
        })
        .fill('wie');
      await page.getByRole('radio', { name: /Vienna|Wiedeń/ }).click();
      await expect(page.getByTestId('events-cities-dialog')).toBeHidden();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Dowolne' : 'Any',
          exact: true,
        })
        .click();
      await page
        .getByRole('radio', { name: 'Sober rave', exact: true })
        .click();
      await expect(
        page.getByRole('radio', { name: 'Sober rave', exact: true }),
      ).toBeHidden();
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Nazwa wydarzenia' : 'Event name',
          exact: true,
        })
        .fill('Dance & coffee');
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Data od' : 'From date',
          exact: true,
        })
        .fill('2029-03-25');
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Data do' : 'Through date',
          exact: true,
        })
        .fill('2029-03-25');
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Znajdź wydarzenia' : 'Find events',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('link', { name: 'Filtered event page 1', exact: true }),
      ).toBeVisible();
      const query = state.queries.at(-1)!.searchParams;
      expect(query.get('countryId')).toBe(country.id);
      expect(query.get('cityId')).toBe(city.id);
      expect(query.get('q')).toBe('Dance & coffee');
      expect(query.get('category')).toBe('SOBER_RAVE');
      expect(
        Date.parse(query.get('to')!) - Date.parse(query.get('from')!),
      ).toBe(23 * 3600000);
      expect(query.has('sort')).toBe(false);
      expect(query.has('latitude')).toBe(false);
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Następna' : 'Next',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('link', { name: 'Filtered event page 2', exact: true }),
      ).toBeVisible();
      await page.getByTestId('events-countries').click();
      await page
        .getByRole('radio', {
          name: language === 'pl' ? 'Polska' : 'Poland',
          exact: true,
        })
        .click();
      await expect(page.getByTestId('events-cities')).toHaveAccessibleName(
        language === 'pl' ? 'Wybierz miasto' : 'Choose city',
      );
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Wyczyść filtry' : 'Clear filters',
          exact: true,
        })
        .first()
        .click();
      await expect(page.getByTestId('events-cities')).toBeDisabled();
      await page.screenshot({
        path: info.outputPath(`catalog-${language}-${theme}.png`),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    });
    test(`Home requires explicit consent, shows real tickets and clears on revoke ${language} ${theme}`, async ({
      page,
      context,
    }, info) => {
      const state = await install(page, language, theme);
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({
        latitude: 48.21234567,
        longitude: 16.31234567,
      });
      await login(page);
      await expect(page.getByTestId('nearby-events')).toHaveCount(0);
      expect(state.nearby).toHaveLength(0);
      await page.goto('/account-preferences');
      await page.getByTestId('events-location-enable').click();
      await expect(page.getByTestId('events-location-disable')).toBeVisible();
      await page.goto('/'); // Full reload resets session-only consent: use client navigation below instead.
      await expect(page.getByTestId('nearby-events')).toHaveCount(0);
      await page.goto('/account-preferences');
      await page.getByTestId('events-location-enable').click();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Otwórz menu' : 'Open menu',
          exact: true,
        })
        .click();
      await page
        .getByRole('link', {
          name: language === 'pl' ? 'Strona główna' : 'Main page',
          exact: true,
        })
        .click();
      await expect(page.getByTestId('nearby-ticket')).toHaveCount(2);
      expect(state.nearby.at(-1)?.body).toMatchObject({
        latitude: 48.21234567,
        longitude: 16.31234567,
      });
      await page
        .getByTestId('nearby-ticket')
        .first()
        .screenshot({
          path: info.outputPath(`ticket-${language}-${theme}.png`),
        });
      await page.screenshot({
        path: info.outputPath(`nearby-${language}-${theme}.png`),
        fullPage: true,
      });
      expect(
        await page.evaluate(() =>
          Object.entries(localStorage).every(
            ([key, value]) =>
              !/location|latitude|longitude/i.test(key) &&
              !value.includes('48.21234567') &&
              !value.includes('16.31234567'),
          ),
        ),
      ).toBe(true);
      await page.getByTestId('nearby-ticket').first().click();
      await expect(page).toHaveURL(new RegExp(event.id));
      await expect(
        page.getByText(event.description, { exact: true }),
      ).toBeVisible();
      await page.goto('/account-preferences');
      await page.getByTestId('events-location-enable').click();
      await page.getByTestId('events-location-disable').click();
      await expect(page.getByTestId('events-location-enable')).toBeVisible();
    });
  }
test('empty nearby has a catalog link and network failure is a different state', async ({
  page,
  context,
}) => {
  const state = await install(page);
  state.setMode('empty');
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({
    latitude: 48.21234567,
    longitude: 16.31234567,
  });
  await login(page);
  await page.goto('/account-preferences');
  await page.getByTestId('events-location-enable').click();
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('link', { name: 'Main page', exact: true }).click();
  await expect(
    page
      .getByText('No events nearby — check out the event base', {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
  await page.getByTestId('nearby-event-base').click();
  await expect(page).toHaveURL(/\/events$/);
  state.setMode('error');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('link', { name: 'Main page', exact: true }).click();
  await expect(
    page
      .getByTestId('nearby-events')
      .getByRole('alert')
      .getByText('We could not load events. Please try again.', {
        exact: true,
      }),
  ).toBeVisible();
  await expect(
    page
      .getByText('No events nearby — check out the event base', {
        exact: true,
      })
      .filter({ visible: true }),
  ).toHaveCount(0);
  state.setMode('empty');
  await page
    .getByTestId('nearby-events')
    .getByRole('button', { name: 'Try again', exact: true })
    .click();
  await expect(
    page
      .getByText('No events nearby — check out the event base', {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
});

test('refusal hides the complete Home section and does not send coordinates', async ({
  page,
}) => {
  const state = await install(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          failure: PositionErrorCallback,
        ) => failure({ code: 1 } as GeolocationPositionError),
      },
    });
  });
  await login(page);
  await page.goto('/account-preferences');
  await page.getByTestId('events-location-enable').click();
  await expect(
    page.getByText(
      'Location permission was declined or revoked. Home will hide nearby events. You can still search the event base.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('link', { name: 'Main page', exact: true }).click();
  await expect(page.getByTestId('nearby-events')).toHaveCount(0);
  expect(state.nearby).toHaveLength(0);
});
for (const unavailable of ['timeout', 'unsupported'] as const)
  test(`consent with ${unavailable} gives location unavailable, not empty supply`, async ({
    page,
    context,
  }) => {
    const state = await install(page);
    await context.grantPermissions(['geolocation']);
    await page.addInitScript((mode) => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value:
          mode === 'unsupported'
            ? undefined
            : {
                getCurrentPosition: (
                  _success: PositionCallback,
                  failure: PositionErrorCallback,
                ) => failure({ code: 3 } as GeolocationPositionError),
              },
      });
    }, unavailable);
    await login(page);
    await page.goto('/account-preferences');
    await page.getByTestId('events-location-enable').click();
    await expect(page.getByTestId('events-location-disable')).toBeVisible();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('link', { name: 'Main page', exact: true }).click();
    await expect(
      page
        .getByTestId('nearby-events')
        .getByRole('alert')
        .getByText(
          'Location unavailable. Try again or search the event base.',
          { exact: true },
        ),
    ).toBeVisible();
    await expect(page.getByTestId('nearby-event-base')).toBeVisible();
    expect(state.nearby).toHaveLength(0);
  });
