import { expect, test } from '@playwright/test';
import { install, login, event } from './fixtures';
for (const language of ['en', 'pl'] as const)
  for (const theme of ['light', 'dark'] as const) {
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
