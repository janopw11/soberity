import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
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
  country_id: country.id,
  country_name: 'Austria',
  country_label_en: 'Austria',
  country_label_pl: 'Austria',
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
      expect(url.searchParams.has('countryId')).toBe(false);
      const matches = [city.name, city.label_en, city.label_pl].some((name) =>
        name
          .toLowerCase()
          .includes((url.searchParams.get('q') ?? '').toLowerCase()),
      );
      value = {
        items: matches ? [city] : [],
        page: 0,
        size: 10,
        total: matches ? 1 : 0,
      };
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
      if (mode === 'error') {
        await route.fulfill({ status: 503, headers: cors, json: {} });
        return;
      }
      const count = url.searchParams.has('q') ? 13 : 0,
        page = Number(url.searchParams.get('page') ?? 0);
      value = {
        items:
          count && mode !== 'empty'
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

export { install, login, country, poland, city, event };
