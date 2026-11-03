import { expect, test } from '@playwright/test';

test('welcome routes explain unavailable features and return home', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /More to life\.\s*Together\./ }),
  ).toBeVisible();

  for (const [, route, title] of [
    ['Science & Discover', '/science', 'Science'],
    ['Sober Events', '/events', 'Sober Events'],
  ] as const) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(
      page.getByText('Not available yet', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: title, exact: true }).last(),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Back to welcome' }).click();
    await expect(
      page.getByRole('heading', { name: /More to life\.\s*Together\./ }),
    ).toBeVisible();
  }

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /More to life\.\s*Together\./ }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('welcome.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('direct route survives reload and unknown route offers recovery', async ({
  page,
}) => {
  await page.goto('/science');
  await page.reload();
  await expect(
    page.getByText('Not available yet', { exact: true }),
  ).toBeVisible();

  await page.goto('/missing-page');
  await expect(
    page.getByRole('heading', { name: 'Page not found', exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to welcome' }).click();
  await expect(
    page.getByRole('heading', { name: /More to life\.\s*Together\./ }),
  ).toBeVisible();
});

test('authenticated and verification-pending routes are guarded for guests', async ({
  page,
}) => {
  // Guest sessions cannot access account content.
  for (const route of ['/account', '/verification-pending']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: /More to life\.\s*Together\./ }),
    ).toBeVisible();
    await expect(page.getByText('Your account', { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText('Confirm your email', { exact: true }),
    ).toHaveCount(0);
  }
});

test('guest welcome retains working sign-in and signup links without a menu', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Open menu', exact: true }),
  ).toHaveCount(0);
  await page.getByTestId('welcome-sign-in').click();
  await expect(page.getByTestId('sign-in-submit')).toBeVisible();
  await page.goto('/');
  await page.getByTestId('welcome-sign-up').click();
  await expect(page.getByTestId('sign-up-submit')).toBeVisible();
});
