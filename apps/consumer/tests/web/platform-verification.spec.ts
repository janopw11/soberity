import { expect, test } from '@playwright/test';

// These checks deliberately need no working backend or Firebase emulator.
test('action deep links without a code offer recovery after reload', async ({
  page,
}) => {
  for (const [path, title, recovery] of [
    [
      '/verify-email',
      'Verification link unavailable',
      'Already verified? Sign in',
    ],
    ['/reset-password', 'Reset link unavailable', 'Request a new reset link'],
  ] as const) {
    await page.goto(path);
    await page.reload();
    await expect(
      page.getByRole('heading', { name: title, exact: true }).last(),
    ).toBeVisible();
    await expect(page.getByTestId('reset-password-submit')).toHaveCount(0);
    await expect(page.getByText(recovery, { exact: true })).toBeVisible();
  }
});

test('sign-in fields and password reveal are keyboard accessible', async ({
  page,
}) => {
  await page.goto('/sign-in');
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  const password = page.getByLabel('Password', { exact: true });
  await email.focus();
  await page.keyboard.type('keyboard@example.test');
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.type('Keyboard-Test-2026!');
  await page.keyboard.press('Tab');
  const reveal = page.getByRole('button', {
    name: 'Show password',
    exact: true,
  });
  await expect(reveal).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(password).toHaveJSProperty('type', 'text');
  await page.keyboard.press('Enter');
  await expect(password).toHaveJSProperty('type', 'password');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('sign-in-submit')).toBeFocused();
});

test('failed reset network request shows a recoverable error', async ({
  page,
}) => {
  await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.abort('internetdisconnected'),
  );
  await page.goto('/reset-password?oobCode=network-test-code');
  await expect(page.getByTestId('reset-password-retry')).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByTestId('reset-password-submit')).toHaveCount(0);
  await page.getByTestId('reset-password-retry').click();
  await expect(page.getByTestId('reset-password-retry')).toBeEnabled({
    timeout: 30000,
  });
});
