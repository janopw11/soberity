import { expect, test, type Page } from '@playwright/test';
import { install, event } from './fixtures';
const title = 'Clear nights: music, movement and connection in Vienna';
const description =
  'A welcoming evening of music and movement, with room to dance, meet people and enjoy the night at your own pace. ';
const detail = {
  ...event,
  title,
  description:
    description.repeat(12) +
    'The final event detail stays readable above the action area.',
  external_ticket_url: null,
  organizer_url: 'https://example.test/organizer',
  organizer_id: null,
};
async function setup(page: Page, language = 'en', theme = 'light') {
  await install(page, language, theme);
  let value: Record<string, unknown> = { ...detail };
  let unavailable = false;
  const reads: string[] = [];
  await page.route(`**/api/v1/events/${event.id}`, async (route) => {
    reads.push(route.request().url());
    await route.fulfill({
      status: unavailable ? 404 : 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: unavailable ? {} : value,
    });
  });
  await page
    .context()
    .route('https://example.test/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>External fixture</title>',
      }),
    );
  return {
    reads,
    set: (update: Record<string, unknown>) => {
      value = { ...value, ...update };
    },
    withdraw: () => {
      unavailable = true;
    },
  };
}
for (const language of ['en', 'pl'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`editorial detail layout, scrolling and external action ${language} ${theme}`, async ({
      page,
    }) => {
      const state = await setup(page, language, theme);
      await page.goto(`/events/${event.id}`);
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole('heading', {
          name: language === 'en' ? 'About event' : 'O wydarzeniu',
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText('Vienna City Centre', { exact: true }),
      ).toHaveCount(0); // No invented venue.
      await expect(
        page.getByText(
          language === 'en' ? 'Synthetic venue' : 'Synthetic venue',
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByText(/Event timezone:|Strefa czasowa wydarzenia:/),
      ).toHaveCount(0);
      await expect(
        page.getByRole('heading', {
          name: /Alcohol policy|Venue & accessibility/,
        }),
      ).toHaveCount(0);
      const cta = page.getByRole('button', {
        name: language === 'en' ? 'View organizer' : 'Strona organizatora',
        exact: true,
      });
      await expect(cta).toBeVisible();
      await expect(
        page.getByText(/Preview \/ test listing|Wpis podglądowy \/ testowy/),
      ).toHaveCount(0);
      const hero = await page.getByTestId('event-detail-hero').boundingBox();
      const heading = await page
        .getByRole('heading', { name: title, exact: true })
        .boundingBox();
      expect(hero!.y).toBeLessThan(heading!.y);
      expect(hero!.width).toBeGreaterThan(
        Math.min(1000, page.viewportSize()!.width) - 5,
      );
      await page.screenshot({
        path: `/tmp/soberity-detail-${language}-${theme}-${page.viewportSize()!.width}.png`,
      });
      const scroll = page.getByTestId('event-detail-scroll');
      await scroll.hover();
      await page.mouse.wheel(0, 650);
      await expect
        .poll(() => scroll.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await scroll.evaluate((element) =>
        element.scrollTo(0, element.scrollHeight),
      );
      await expect(cta).toBeVisible();
      const bar = await page
        .getByTestId('event-detail-action-bar')
        .boundingBox();
      const content = await page
        .getByText(/The final event detail stays readable/)
        .boundingBox();
      expect(content!.y + content!.height).toBeLessThanOrEqual(bar!.y);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await cta.click();
      await expect(
        page
          .getByText('Continue to example.test')
          .or(page.getByText('Przejdź do example.test')),
      ).toBeVisible();
      const popup = page.waitForEvent('popup');
      await page
        .getByRole('button', { name: /^Continue ↗$|^Przejdź ↗$/ })
        .click();
      const external = await popup;
      await expect(external).toHaveURL('https://example.test/organizer');
      await external.close();
      expect(state.reads.length).toBeGreaterThanOrEqual(2);
    });
  }
test('tickets require current eligibility and changed destinations never open', async ({
  page,
}) => {
  const state = await setup(page);
  state.set({
    external_ticket_url: 'https://example.test/tickets',
    availability: 'AVAILABLE',
    price_kind: 'PAID',
    price_minor: 2500,
    currency: 'EUR',
  });
  await page.goto(`/events/${event.id}`);
  await expect(page.getByText('€25.00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Get tickets', exact: true }).click();
  state.set({ external_ticket_url: 'https://example.test/changed' });
  const popups: Page[] = [];
  page.on('popup', (popup) => popups.push(popup));
  await page.getByRole('button', { name: 'Continue ↗', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'This action could not be completed.',
  );
  expect(popups).toHaveLength(0);
  state.withdraw();
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'This event is unavailable',
  );
  await expect(
    page.getByRole('button', { name: 'Get tickets', exact: true }),
  ).toHaveCount(0);
});
test('fictional warning, missing image and optional fields stay honest', async ({
  page,
}) => {
  const state = await setup(page);
  state.set({
    description: 'Fictional test event, not a real gathering.',
    cover_id: null,
    venue_name: '',
    address: '',
    city: '',
    city_en: '',
    city_pl: '',
    country_code: '',
    starts_at: 'invalid',
    organizer_url: 'javascript:alert(1)',
    external_ticket_url: 'https://example.test/tickets',
    price_kind: 'UNKNOWN',
    availability: 'UNKNOWN',
  });
  await page.goto(`/events/${event.id}`);
  await expect(page.getByRole('alert')).toContainText('Preview / test listing');
  await expect(
    page.getByText('Fictional test event, not a real gathering.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('An experience worth discovering', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Get tickets', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'View organizer', exact: true }),
  ).toHaveCount(0);
  state.set({ description: '', external_ticket_url: null });
  await page.reload();
  await expect(
    page.getByText('More information has not been provided yet.', {
      exact: true,
    }),
  ).toBeVisible();
});
test('real organizer data is presented without requiring it for event content', async ({
  page,
}) => {
  const state = await setup(page);
  state.set({ organizer_id: '50000000-0000-4000-8000-000000000001' });
  await page.route('**/api/v1/organizers/*', (route) =>
    route.fulfill({
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: {
        id: '50000000-0000-4000-8000-000000000001',
        name: 'Community Dance Collective',
        description: 'Independent music and dance experiences.',
        website: 'https://example.test/organizer',
        verification: 'VERIFIED',
      },
    }),
  );
  await page.goto(`/events/${event.id}`);
  await expect(
    page.getByText('Community Dance Collective', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Verified organizer', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'View organizer', exact: true }),
  ).toBeVisible();
});
