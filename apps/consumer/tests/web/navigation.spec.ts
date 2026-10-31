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
    ['Science & Discover', '/science', 'Science'],
    ['Sober Events', '/events', 'Sober Events'],
  ] as const) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const destination = page.getByRole('link', { name: link, exact: true });
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
      page.getByText('Not available yet', { exact: true }),
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
    page.getByText('Not available yet', { exact: true }),
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

test('authenticated and verification-pending routes are guarded for guests', async ({
  page,
}) => {
  // No sign-in exists yet (P0-I05/P0-I06): every visitor is a guest, so the
  // (authenticated) and verification-pending routes must never render their
  // content and must bounce back to the public welcome screen instead.
  for (const route of ['/account', '/verification-pending']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('An early preview', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Your account', { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText('Confirm your email', { exact: true }),
    ).toHaveCount(0);
  }
});

test('hamburger at top left opens all features with emoji and closes after navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const menu = page.getByTestId('side-menu');
  await expect(menu).toHaveCount(0);
  const trigger = page.getByRole('button', { name: 'Open menu', exact: true });
  const bounds = (await trigger.boundingBox())!;
  expect(bounds.x).toBeLessThan(48);
  expect(bounds.y).toBeLessThan(64);
  expect(bounds.width).toBeGreaterThanOrEqual(48);
  expect(bounds.height).toBeGreaterThanOrEqual(48);
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Planned', { exact: true })).toHaveCount(0);
  const labels = [
    'Main page',
    'Science & Discover',
    'Sober Events',
    'Sober Games',
    'Soberity (community)',
    'World Map',
    'Brain Lab',
    'Myth Buster',
  ];
  // The close control is separate from the eight product destinations.
  await expect(menu.getByRole('link')).toHaveCount(3);
  await expect(menu.getByRole('button')).toHaveCount(6);
  for (const label of labels) {
    await expect(
      menu
        .getByRole('link', { name: label, exact: true })
        .or(menu.getByRole('button', { name: label, exact: true })),
    ).toBeVisible();
  }
  for (const label of labels.slice(3)) {
    await expect(
      menu.getByRole('button', { name: label, exact: true }),
    ).toBeDisabled();
  }
  await expect(menu.getByText('🏠', { exact: true })).toHaveCount(1);
  await expect(menu.getByText('🔬', { exact: true })).toHaveCount(1);
  await expect(menu.getByText('🎉', { exact: true })).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('menu-open.png') });
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await page.getByRole('link', { name: 'Sober Events', exact: true }).click();
  await expect(page).toHaveURL(/events$/);
  await expect(menu).toHaveCount(0);
  await expect(
    page.getByText('Not available yet', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(
    menu.getByRole('link', { name: 'Sober Events', exact: true }),
  ).toContainText('› Sober Events');
  await page
    .getByTestId('menu-backdrop')
    .click({ position: { x: page.viewportSize()!.width - 5, y: 100 } });
  await expect(menu).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('Polish hamburger menu shows emoji without planned captions', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    locale: 'pl-PL',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Otwórz menu', exact: true }).click();
  const menu = page.getByTestId('side-menu');
  await expect(menu.getByText('Planowane', { exact: true })).toHaveCount(0);
  await expect(
    menu.getByRole('button', { name: 'Soberity (społeczność)', exact: true }),
  ).toBeDisabled();
  await expect(
    menu.getByRole('button', { name: 'Myth Buster', exact: true }),
  ).toBeVisible();
  await menu
    .getByRole('link', { name: 'Strona główna', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('side-menu-pl.png') });
  await page.getByRole('button', { name: 'Zamknij menu', exact: true }).click();
  await expect(menu).toHaveCount(0);
  await page.getByRole('button', { name: 'Otwórz menu', exact: true }).click();
  await menu
    .getByRole('link', { name: 'Science & Discover', exact: true })
    .click();
  await expect(page).toHaveURL(/science$/);
  await expect(menu).toHaveCount(0);
  await context.close();
});
