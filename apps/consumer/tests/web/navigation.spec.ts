import { expect, test } from '@playwright/test';

test('welcome routes explain unavailable features and return home', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByText('An early preview', { exact: true }),
  ).toBeVisible();
  for (const [link, route, title] of [
    ['Explore Science', '/science', 'Science'],
    ['Explore Events', '/events', 'Events & Community'],
    ['Your account — coming later', '/account', 'Your account'],
  ] as const) {
    const destination = page.getByRole('link').filter({ hasText: link });
    await destination.scrollIntoViewIfNeeded();
    const bounds = await destination.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await destination.click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(
      page.getByText('NOT AVAILABLE YET', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: title, exact: true }).last(),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Back to welcome' }).click();
    await expect(
      page.getByText('An early preview', { exact: true }),
    ).toBeVisible();
  }
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'More to life. Together.' }),
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
    page.getByText('NOT AVAILABLE YET', { exact: true }),
  ).toBeVisible();
  await page.goto('/missing-page');
  await expect(
    page.getByRole('heading', { name: 'Page not found', exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to welcome' }).click();
  await expect(
    page.getByText('An early preview', { exact: true }),
  ).toBeVisible();
});
