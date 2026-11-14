import { expect, test } from '@playwright/test';
import { install, login, event } from './fixtures';

for (const language of ['en', 'pl'])
  for (const theme of ['light', 'dark']) {
    test(`RSVP persists, cancels and updates count ${language} ${theme}`, async ({
      page,
    }, info) => {
      await install(page, language, theme);
      let declared = false;
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
      };
      await page.route('**/api/v1/me/event-interests**', async (route) => {
        const method = route.request().method();
        if (method === 'OPTIONS') {
          await route.fulfill({ status: 204, headers });
          return;
        }
        expect(route.request().headers().authorization).toMatch(/^Bearer /);
        if (method === 'PUT' || method === 'DELETE') {
          declared = method === 'PUT';
          await route.fulfill({ status: 204, headers });
          return;
        }
        await route.fulfill({
          headers,
          json: {
            declared,
            participant_count: declared ? 3 : 2,
            can_join: true,
          },
        });
      });
      await login(page);
      await page.goto(`/events/${event.id}`);
      const button = page.getByTestId('event-going-button');
      await expect(button).toHaveText(
        language === 'pl' ? 'Dołącz do wydarzenia' : 'Join Event',
      );
      await expect(page.getByTestId('event-participant-count')).toHaveText(
        language === 'pl' ? '2 uczestników' : '2 participants',
      );
      await button.click();
      await expect(button).toHaveText(
        language === 'pl' ? 'Anuluj udział' : 'Cancel RSVP',
      );
      await expect(page.getByTestId('event-participant-count')).toHaveText(
        language === 'pl' ? '3 uczestników' : '3 participants',
      );
      await page.reload();
      await expect(button).toHaveText(
        language === 'pl' ? 'Anuluj udział' : 'Cancel RSVP',
      );
      await button.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath('rsvp.png') });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await button.click();
      await expect(button).toHaveText(
        language === 'pl' ? 'Dołącz do wydarzenia' : 'Join Event',
      );
      await expect(page.getByTestId('event-participant-count')).toHaveText(
        language === 'pl' ? '2 uczestników' : '2 participants',
      );
      await page.reload();
      await expect(button).toHaveText(
        language === 'pl' ? 'Dołącz do wydarzenia' : 'Join Event',
      );
    });
  }
test('guest count and sign-in gate', async ({ page }) => {
  await install(page);
  await page.route(`**/api/v1/events/${event.id}/participation`, (route) =>
    route.fulfill({
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: { participant_count: 2, can_join: true },
    }),
  );
  await page.goto(`/events/${event.id}`);
  await expect(page.getByTestId('event-participant-count')).toHaveText(
    '2 participants',
  );
  await page.getByRole('button', { name: 'Sign in to join' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
test('unknown server state requires refresh before another write', async ({
  page,
}) => {
  await install(page);
  let declared = false;
  await page.route('**/api/v1/me/event-interests/**', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (route.request().method() === 'PUT') {
      declared = true;
      await route.fulfill({ status: 503, headers, json: {} });
      return;
    }
    await route.fulfill({
      headers,
      json: { declared, participant_count: declared ? 1 : 0, can_join: true },
    });
  });
  await login(page);
  await page.goto(`/events/${event.id}`);
  await page.getByRole('button', { name: 'Join Event', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Refresh participation' }),
  ).toBeVisible();
  await expect(page.getByTestId('event-going-button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh participation' }).click();
  await expect(page.getByRole('button', { name: 'Cancel RSVP' })).toBeVisible();
  await expect(page.getByTestId('event-participant-count')).toHaveText(
    '1 participant',
  );
});
