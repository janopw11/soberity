import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { install, login, event } from './fixtures';
import type { Circle } from '../../src/circles/circlesApi';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
async function circlesFixture(page: Page, initial = true) {
  let circle: Circle | null = initial
    ? {
        id: '50000000-0000-4000-8000-000000000001',
        name: 'Fixture runners',
        slug: 'fixture-runners',
        description: 'Synthetic circle for acceptance tests.',
        guidelines: 'Be kind. Respect boundaries.',
        category: 'FITNESS',
        cover_id: null,
        cover_alt: null,
        active: true,
        joined: false,
        member_count: 0,
        version: 1,
        event_ids: [event.id],
      }
    : null;
  let fail = false;
  await page.route(/\/api\/v1\/(?:admin\/|me\/)?circles/, async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (fail) {
      await route.fulfill({ status: 503, headers, json: {} });
      return;
    }
    if (path.includes('/admin/') || path.includes('/me/'))
      expect(req.headers().authorization).toMatch(/^Bearer /);
    if (path.includes('/admin/') && (method === 'POST' || method === 'PUT')) {
      const body = req.postDataJSON();
      circle = {
        ...body,
        id: circle?.id ?? '50000000-0000-4000-8000-000000000001',
        version: (circle?.version ?? 0) + 1,
        cover_id: body.coverId,
        cover_alt: null,
        event_ids: body.eventIds,
        member_count: circle?.member_count ?? 0,
        joined: circle?.joined ?? false,
      };
      await route.fulfill({
        status: method === 'POST' ? 201 : 200,
        headers,
        json: circle,
      });
      return;
    }
    if (path.includes('/me/') && (method === 'PUT' || method === 'DELETE')) {
      if (circle) {
        circle.joined = method === 'PUT';
        circle.member_count = circle.joined ? 1 : 0;
      }
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (path.endsWith('/circles')) {
      const items =
        circle &&
        (path.includes('/admin/') ||
          (path.includes('/me/') ? circle.joined : circle.active)) &&
        (!url.searchParams.get('q') ||
          circle.name
            .toLowerCase()
            .includes(url.searchParams.get('q')!.toLowerCase())) &&
        (!url.searchParams.get('category') ||
          circle.category === url.searchParams.get('category'))
          ? [circle]
          : [];
      await route.fulfill({
        headers,
        json: { items, total: items.length, page: 0, size: 12 },
      });
      return;
    }
    if (path.endsWith('/events')) {
      await route.fulfill({
        headers,
        json: {
          items: circle?.event_ids?.includes(event.id) ? [event] : [],
          total: 1,
          page: 0,
          size: 12,
        },
      });
      return;
    }
    if (
      !circle ||
      (!circle.active && !path.includes('/admin/') && !path.includes('/me/'))
    ) {
      await route.fulfill({ status: 404, headers, json: {} });
      return;
    }
    await route.fulfill({ headers, json: circle });
  });
  await page.route('**/api/v1/admin/events**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes('/media/') && route.request().method() === 'GET') {
      await route.fulfill({
        headers: { ...headers, 'Content-Type': 'image/jpeg' },
        body: readFileSync(
          new URL(
            '../../assets/images/schonbrunn-vienna-preview.jpeg',
            import.meta.url,
          ),
        ),
      });
      return;
    }
    if (path.endsWith('/media') && route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        headers,
        json: { id: event.cover_id },
      });
      return;
    }
    if (path.endsWith(event.id)) {
      await route.fulfill({
        headers,
        json: { content: { cover_id: event.cover_id } },
      });
      return;
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    await route.fulfill({
      headers,
      json: { items: [{ ...event, version: 2 }], total: 1, page: 0, size: 20 },
    });
  });
  return {
    deactivate: () => {
      if (circle) circle.active = false;
    },
    setFailure: (value: boolean) => {
      fail = value;
    },
    get: () => circle,
  };
}
for (const language of ['en', 'pl'])
  for (const theme of ['light', 'dark']) {
    test(`Circle discovery membership and related Events ${language} ${theme}`, async ({
      page,
    }, info) => {
      await install(page, language, theme);
      const state = await circlesFixture(page);
      await login(page);
      await page.goto('/community');
      await page.getByRole('button', { name: /Sober Circles/ }).click();
      await expect(page).toHaveURL(/\/circles$/);
      const openFilters = () =>
        page.getByTestId('circles-open-filters').click();
      const applyFilters = () =>
        page
          .getByRole('button', {
            name: language === 'pl' ? 'Pokaż kręgi' : 'Show circles',
            exact: true,
          })
          .click();
      await openFilters();
      const search = page.getByRole('textbox', {
        name: language === 'pl' ? 'Szukaj kręgów' : 'Search Circles',
        exact: true,
      });
      await search.fill('discard this draft');
      await page.getByTestId('events-filters-dialog-close').click();
      await openFilters();
      await expect(search).toHaveValue('');
      await page.screenshot({
        path: info.outputPath('circle-filters.png'),
        fullPage: true,
      });
      await search.fill('missing');
      await search.press('Enter');
      await expect(
        page.getByRole('heading', { name: 'Fixture runners', exact: true }),
      ).toHaveCount(0);
      await openFilters();
      await search.fill('runners');
      await page
        .getByRole('button', {
          name: language === 'pl' ? /^Kategoria:/ : /^Category:/,
        })
        .click();
      await page.getByRole('radio', { name: /Art|Sztuka/ }).click();
      await applyFilters();
      await expect(
        page.getByRole('heading', { name: 'Fixture runners', exact: true }),
      ).toHaveCount(0);
      await openFilters();
      await page
        .getByRole('button', {
          name: language === 'pl' ? /^Kategoria:/ : /^Category:/,
        })
        .click();
      await page.getByRole('radio', { name: /Fitness|Sport/ }).click();
      await applyFilters();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Dołącz do kręgu' : 'Join Circle',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('button', {
          name: language === 'pl' ? 'Opuść krąg' : 'Leave Circle',
          exact: true,
        }),
      ).toBeVisible();
      await page.reload();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Odkryj krąg' : 'Explore Circle',
          exact: true,
        })
        .click();
      await expect(
        page.getByText('Be kind. Respect boundaries.', { exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByText(
            language === 'pl' ? '1 osoba · Dołączono' : '1 member · Joined',
            { exact: true },
          )
          .filter({ visible: true }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath('circle-detail.png'),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.getByTestId('event-ticket').click();
      await expect(page).toHaveURL(new RegExp(event.id));
      state.deactivate();
      await page.goto('/circles');
      await openFilters();
      await page
        .getByRole('button', {
          name: language === 'pl' ? /^Kręgi:/ : /^Circles:/,
        })
        .click();
      await page
        .getByRole('radio', {
          name: language === 'pl' ? 'Moje kręgi' : 'My Circles',
          exact: true,
        })
        .click();
      await applyFilters();
      await expect(
        page.getByText(language === 'pl' ? 'Nieaktywny' : 'Inactive', {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Opuść krąg' : 'Leave Circle',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Fixture runners', exact: true }),
      ).toHaveCount(0);
    });
  }
test('existing administration creates edits associates and deactivates Circles', async ({
  page,
}) => {
  await install(page);
  const state = await circlesFixture(page, false);
  await login(page);
  await page.goto('/editorial-events');
  await page
    .getByRole('link', { name: 'Manage Sober Circles', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Create Circle', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Circle name', exact: true })
    .fill('New fixture circle');
  await page
    .getByRole('textbox', { name: /^Unique slug/ })
    .fill('new-fixture-circle');
  await page
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Shared experiences');
  await page
    .getByRole('textbox', { name: 'Community guidelines', exact: true })
    .fill('Respect everyone');
  await page.getByRole('combobox').selectOption('FITNESS');
  await page
    .getByRole('textbox', { name: 'Cover image description', exact: true })
    .fill('Synthetic cover');
  await page
    .locator('input[type=file]')
    .setInputFiles(
      fileURLToPath(
        new URL(
          '../../assets/images/schonbrunn-vienna-preview.jpeg',
          import.meta.url,
        ),
      ),
    );
  await expect(
    page.getByText('Cover selected.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('switch', { name: 'Active', exact: true }).click();
  await page.getByRole('checkbox', { name: /Synthetic sober rave/ }).check();
  await page
    .getByRole('textbox', { name: /^Unique slug/ })
    .fill('Invalid Slug');
  await page.getByRole('button', { name: 'Save Circle', exact: true }).click();
  await expect(
    page.getByText(
      'Use lowercase a–z, numbers and single hyphens between words, up to 100 characters. No spaces or accented letters.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(state.get()).toBeNull();
  await page
    .getByRole('textbox', { name: /^Unique slug/ })
    .fill('new-fixture-circle');
  await page.getByRole('button', { name: 'Save Circle', exact: true }).click();
  await expect(page.getByText('Circle saved.', { exact: true })).toBeVisible();
  expect(state.get()?.event_ids).toEqual([event.id]);
  expect(state.get()?.cover_id).toBe(event.cover_id);
  await page
    .getByRole('button', { name: 'New fixture circle · Active', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Circle name', exact: true })
    .fill('Updated fixture circle');
  await page.getByRole('switch', { name: 'Active', exact: true }).click();
  await page.getByRole('button', { name: 'Save Circle', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Updated fixture circle · Inactive',
      exact: true,
    }),
  ).toBeVisible();
});
test('Circle load failure can be retried', async ({ page }) => {
  await install(page);
  const state = await circlesFixture(page);
  await login(page);
  state.setFailure(true);
  await page.goto('/circles');
  await expect(
    page.getByText('Circles could not be loaded. Please try again.', {
      exact: true,
    }),
  ).toBeVisible();
  state.setFailure(false);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Fixture runners', exact: true }),
  ).toBeVisible();
});
