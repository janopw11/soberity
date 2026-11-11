import { expect, test } from '@playwright/test';
import { install, event } from './fixtures';
for (const [language, theme] of [
  ['en', 'light'],
  ['pl', 'dark'],
] as const) {
  test(`clusters split and colocated events remain selectable ${language} ${theme}`, async ({
    page,
  }) => {
    await install(page, language, theme);
    await page.route('https://maps.geoapify.com/**', (route) =>
      route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    );
    const items = [
      {
        ...event,
        id: '30000000-0000-4000-8000-000000000001',
        title: 'First venue event',
        coordinate_source: 'VENUE',
        latitude: 48.2082,
        longitude: 16.3738,
      },
      {
        ...event,
        id: '30000000-0000-4000-8000-000000000002',
        title: 'Second venue event',
        coordinate_source: 'VENUE',
        latitude: 48.2082,
        longitude: 16.3738,
      },
      {
        ...event,
        id: '30000000-0000-4000-8000-000000000003',
        title: 'Nearby event',
        coordinate_source: 'VENUE',
        latitude: 48.2102,
        longitude: 16.3758,
      },
    ];
    await page.route('**/api/v1/events?*', (route) =>
      route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: { items, total: 3, page: 0, size: 100 },
      }),
    );
    await page.goto('/events');
    await page
      .getByRole('button', {
        name: language === 'en' ? 'Map' : 'Mapa',
        exact: true,
      })
      .click();
    const cluster = page.locator('.ev-cluster-icon');
    await expect(cluster).toHaveCount(1);
    await expect(cluster).toHaveText('3');
    await cluster.click();
    await expect(page.locator('.ev-marker-icon')).toHaveCount(1);
    await expect(cluster).toHaveText('2');
    await cluster.click();
    await cluster.click();
    await page
      .getByRole('button', { name: 'Second venue event', exact: true })
      .click();
    await expect(
      page.getByRole('dialog', { name: 'Second venue event' }),
    ).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Zoom out' : 'Oddal',
          exact: true,
        })
        .click();
      await page.waitForTimeout(350);
    }
    await expect(cluster).toHaveText('3');
  });
}
