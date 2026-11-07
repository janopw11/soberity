import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { install, login, country, city, event } from './fixtures';
const picture = readFileSync(
  new URL(
    '../../assets/images/schonbrunn-vienna-preview.jpeg',
    import.meta.url,
  ),
);
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
for (const language of ['en', 'pl'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`admin creates, publishes and deletes without organizer ${language} ${theme}`, async ({
      page,
    }) => {
      await install(page, language, theme);
      const writes: {
        method: string;
        path: string;
        body: Record<string, unknown>;
      }[] = [];
      let detail: Record<string, unknown> | null = null;
      let removed = false;
      let organizerRequests = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/v1/organizer/')) organizerRequests++;
      });
      await page.route('**/api/v1/locations/cities?**', (route) =>
        route.fulfill({
          headers: cors,
          json: { items: [city], total: 1, page: 0, size: 20 },
        }),
      );
      await page.route('**/api/v1/admin/events**', async (route) => {
        const request = route.request(),
          url = new URL(request.url()),
          path = url.pathname.slice('/api/v1/admin/events'.length),
          method = request.method();
        if (method === 'OPTIONS') {
          await route.fulfill({ status: 204, headers: cors });
          return;
        }
        expect(request.headers().authorization).toMatch(/^Bearer /);
        if (path.startsWith('/media/') && method === 'GET') {
          await route.fulfill({
            headers: { ...cors, 'Content-Type': 'image/jpeg' },
            body: picture,
          });
          return;
        }
        if (path === '/media') {
          await route.fulfill({
            status: 201,
            headers: cors,
            json: { id: event.cover_id },
          });
          return;
        }
        if (method === 'GET') {
          await route.fulfill({
            headers: cors,
            json: path
              ? detail
              : {
                  items:
                    detail && !removed
                      ? [
                          {
                            id: event.id,
                            title: event.title,
                            status: detail.status,
                            version: detail.version,
                          },
                        ]
                      : [],
                  total: detail && !removed ? 1 : 0,
                  page: 0,
                  size: 20,
                },
          });
          return;
        }
        const body =
          method === 'DELETE'
            ? {}
            : (request.postDataJSON() as Record<string, unknown>);
        writes.push({ method, path, body });
        if (method === 'POST' && path === '') {
          expect(body.countryId).toBe(country.id);
          expect(body.cityId).toBe(city.id);
          expect(body.coverId).toBe(event.cover_id);
          expect(body).not.toHaveProperty('organizerId');
          expect(body.endsAt).toBeNull();
          expect(body.descriptionDocument).toMatchObject({ type: 'doc' });
          detail = {
            id: event.id,
            status: 'DRAFT',
            version: 1,
            content: {
              ...event,
              title: body.title,
              description_document: body.descriptionDocument,
              country_name: country.name,
              country_label_en: country.label_en,
              country_label_pl: country.label_pl,
              country_geoname_id: 1,
              city_name: city.name,
              city_label_en: city.label_en,
              city_label_pl: city.label_pl,
              city_geoname_id: 101,
              source_reference: body.sourceReference,
              source_url: body.sourceUrl,
              beverage_rules_confirmed: true,
              content_rights_attested: true,
              alcohol_sold: false,
              alcohol_served: false,
              alcohol_permitted: false,
            },
          };
          await route.fulfill({ status: 201, headers: cors, json: detail });
          return;
        }
        if (path.endsWith('/publish')) {
          expect(body.expectedVersion).toBe(1);
          detail = { ...detail, status: 'PUBLISHED', version: 2 };
        }
        if (method === 'DELETE') {
          expect(url.searchParams.get('expectedVersion')).toBe('2');
          removed = true;
        }
        await route.fulfill({ status: 204, headers: cors });
      });
      await login(page);
      await page.goto('/account');
      await expect(
        page.getByRole('button', {
          name: language === 'en' ? 'Events panel' : 'Panel wydarzeń',
          exact: true,
        }),
      ).toBeVisible();
      await page.goto('/editorial-events');
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Add event' : 'Dodaj wydarzenie',
          exact: true,
        })
        .click();
      const en = language === 'en';
      await page
        .getByLabel(en ? 'Event name *' : 'Nazwa wydarzenia *', { exact: true })
        .fill(event.title);
      await page
        .getByRole('textbox', {
          name: en ? 'Event description' : 'Opis wydarzenia',
          exact: true,
        })
        .fill('Synthetic event description');
      await page
        .getByLabel(/^(Organizer website URL|URL strony organizatora)/)
        .fill('https://example.test/event');
      await page
        .getByLabel(en ? 'Photo description' : 'Opis zdjęcia', { exact: true })
        .fill('Synthetic event photo');
      await page.locator('input[type=file]').setInputFiles({
        name: 'fixture.jpg',
        mimeType: 'image/jpeg',
        buffer: picture,
      });
      await expect(page.locator('img.ev-preview')).toBeVisible();
      await page
        .getByLabel(en ? 'Starts *' : 'Rozpoczęcie *', { exact: true })
        .fill('2029-11-06T20:00');
      await page.getByTestId('events-countries').click();
      await page
        .getByTestId('events-countries-dialog')
        .getByRole('radio', { name: 'Austria', exact: true })
        .click();
      await page.getByTestId('events-cities').click();
      await page
        .getByTestId('events-cities-dialog')
        .getByRole('radio', { name: /^(Vienna|Wiedeń) · Vienna/ })
        .click();
      await page
        .getByLabel(en ? 'Alcohol rules *' : 'Zasady dotyczące alkoholu *', {
          exact: true,
        })
        .fill('No alcohol sold, served or BYOB.');
      await page
        .getByLabel(
          en ? 'Drinks / ABV information *' : 'Informacje o napojach / ABV *',
          { exact: true },
        )
        .fill('Confirmed 0.0% only');
      await page
        .getByLabel(
          en
            ? 'Source and confirmation of event information (private) *'
            : 'Źródło i potwierdzenie informacji o wydarzeniu (prywatne) *',
          { exact: true },
        )
        .fill('Synthetic source confirmation');
      await page
        .getByLabel(en ? 'Source URL (HTTPS) *' : 'Adres źródła (HTTPS) *', {
          exact: true,
        })
        .fill('https://example.test/source');
      for (const checkbox of await page.getByRole('checkbox').all())
        await checkbox.check();
      await page
        .getByRole('button', {
          name: en ? 'Save draft' : 'Zapisz szkic',
          exact: true,
        })
        .click();
      await expect(page.getByRole('status')).toContainText(
        en ? 'Event saved.' : 'Zapisano wydarzenie.',
      );
      await page
        .getByRole('button', {
          name: en ? 'Publish event' : 'Opublikuj wydarzenie',
          exact: true,
        })
        .click();
      await expect(page.getByRole('status')).toContainText(
        en ? 'Event published.' : 'Wydarzenie opublikowane.',
      );
      await page.screenshot({
        path: `/tmp/soberity-event-admin-${language}-${theme}-${page.viewportSize()?.width}.png`,
        fullPage: true,
      });
      page.once('dialog', (dialog) => dialog.accept());
      await page
        .getByRole('button', {
          name: en ? 'Delete event' : 'Usuń wydarzenie',
          exact: true,
        })
        .click();
      await expect(page.getByRole('status')).toContainText(
        en ? 'Event deleted.' : 'Wydarzenie usunięte.',
      );
      expect(writes.map((write) => write.method)).toEqual([
        'POST',
        'POST',
        'DELETE',
      ]);
      expect(organizerRequests).toBe(0);
      expect(
        await page
          .locator('.ev-panel')
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
    });
  }
test('non-admin author sees no event actions or profile entry', async ({
  page,
}) => {
  await install(page);
  await page.route('**/api/v1/editorial/me', (route) =>
    route.fulfill({ headers: cors, json: { roles: ['AUTHOR'] } }),
  );
  await page.route('**/api/v1/admin/events**', (route) =>
    route.fulfill({ status: 403, headers: cors, json: {} }),
  );
  await login(page);
  await page.goto('/editorial-events');
  await expect(page.getByRole('alert')).toContainText(
    'Event administrator access is required.',
  );
  await expect(
    page.getByRole('button', { name: 'Add event', exact: true }),
  ).toHaveCount(0);
  await page.goto('/account');
  await expect(
    page.getByRole('button', { name: 'Events panel', exact: true }),
  ).toHaveCount(0);
});
