import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const emulator = 'http://127.0.0.1:9099';
const projectId = 'demo-soberity';
const password = 'Soberity-Test-2026!';
type ProfileShape = {
  id: string;
  displayName: string | null;
  city: string | null;
  interests: string[];
  locale: string | null;
  updatedAt: string;
};

type OobCode = { email: string; oobCode: string; requestType: string };

test('signup, verification, session restore, offline retry, profile, reauth, reset and deletion', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const email = `p0-i12-${Date.now()}@example.test`;
  let backendDeletes = 0;
  page.on('request', (request) => {
    if (request.method() === 'DELETE' && request.url().endsWith('/api/v1/me')) {
      backendDeletes++;
    }
  });
  let backendVerified = false;
  let backendAvailable = true;
  let profile: ProfileShape = {
    id: 'emulator-user',
    displayName: 'Test Member',
    city: null,
    interests: [],
    locale: 'en',
    updatedAt: '2026-11-03T00:00:00Z',
  };

  await installProfileApiFixture(
    page,
    () => backendVerified,
    profile,
    (value) => {
      profile = value;
    },
    () => backendAvailable,
  );
  await page.goto('/');
  await page.getByTestId('welcome-sign-up').click();
  await fillField(page, 'sign-up-email', email);
  await fillField(page, 'sign-up-username', 'Test Member');
  await fillField(page, 'sign-up-password', password);
  await fillField(page, 'sign-up-confirm-password', password);
  await page.getByTestId('sign-up-submit').click();
  await expect(page).toHaveURL(/\/verification-pending$/);

  const verifyCode = await waitForOobCode(request, email, 'VERIFY_EMAIL');
  backendVerified = true;
  await page.goto(`/verify-email?oobCode=${encodeURIComponent(verifyCode)}`);
  await expect(page.getByText('Email verified', { exact: true })).toBeVisible();
  await page.goto('/account');
  await page.getByTestId('account-sign-out').click();
  await expect(page.getByTestId('welcome-sign-in')).toBeVisible();

  await page.goto('/sign-in');
  await fillField(page, 'sign-in-email', email);
  await fillField(page, 'sign-in-password', password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('home-for-you-today')).toBeVisible();
  await expect(page.getByTestId('news-sleep')).toBeVisible();
  await expect(page.getByTestId('news-evidence')).toBeVisible();
  await expect(page.getByTestId('news-habits')).toHaveCount(0);
  await expect(page.getByTestId('home-go-to-news')).toBeDisabled();

  // Restore the real Firebase browser session, then refuse access while the
  // backend is unreachable. Retry must revalidate before showing private UI.
  await page.reload();
  await expect(page.getByTestId('home-for-you-today')).toBeVisible();
  backendAvailable = false;
  await page.reload();
  await expect(page.getByTestId('offline-retry')).toBeVisible();
  await expect(page.getByTestId('home-for-you-today')).toHaveCount(0);
  backendAvailable = true;
  await page.getByTestId('offline-retry').click();
  await expect(page.getByTestId('home-for-you-today')).toBeVisible();

  await page.getByRole('button', { name: 'Open account', exact: true }).click();
  await page.getByTestId('account-row-personal-data').click();
  await expect(page.getByTestId('account-email')).toContainText(email);
  await expect(page.getByTestId('account-username')).toContainText(
    'Test Member',
  );
  await page.getByTestId('account-username').click();
  await page.getByTestId('account-username-input').fill('Updated Member');
  await page.getByTestId('account-username-input').press('Enter');
  await expect(page.getByTestId('account-username')).toContainText(
    'Updated Member',
  );

  await page.goBack();
  await page.getByTestId('account-row-password').click();
  await expect(page.getByTestId('account-change-password')).toBeDisabled();
  await fillField(page, 'account-current-password', 'Wrong-Password-2026!');
  await fillField(page, 'account-new-password', 'Soberity-Changed-2026!');
  await fillField(page, 'account-confirm-password', 'Soberity-Changed-2026!');
  await page.getByTestId('account-change-password').click();
  await expect(
    page.getByText('The email or password is incorrect.', { exact: true }),
  ).toBeVisible();
  await fillField(page, 'account-current-password', password);
  await page.getByTestId('account-change-password').click();
  await expect(
    page.getByText('Your password has been changed.', { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page.getByTestId('account-sign-out').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('welcome-sign-in')).toBeVisible();

  await page.goto('/sign-in');
  await page.getByTestId('sign-in-forgot-password').click();
  await fillField(page, 'forgot-password-email', email);
  await page.getByTestId('forgot-password-submit').click();
  await expect(
    page.getByText(/If an account exists for this address/),
  ).toBeVisible();

  const resetCode = await waitForOobCode(request, email, 'PASSWORD_RESET');
  await page.goto(`/reset-password?oobCode=${encodeURIComponent(resetCode)}`);
  await fillField(page, 'reset-password-new', 'Soberity-Reset-2026!');
  await fillField(page, 'reset-password-confirm', 'Soberity-Reset-2026!');
  await page.getByTestId('reset-password-submit').click();
  await expect(
    page.getByText('Password updated', { exact: true }),
  ).toBeVisible();
  await page.goto(`/reset-password?oobCode=${encodeURIComponent(resetCode)}`);
  await expect(
    page.getByText('Reset link unavailable', { exact: true }),
  ).toBeVisible();

  await page.goto('/sign-in');
  await fillField(page, 'sign-in-email', email);
  await fillField(page, 'sign-in-password', 'Soberity-Reset-2026!');
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('home-for-you-today')).toBeVisible();
  await page.getByRole('button', { name: 'Open account', exact: true }).click();
  await page.getByTestId('account-delete').click();
  await expect(page.getByTestId('account-delete-confirm')).toBeDisabled();
  await fillField(page, 'account-delete-password', 'Wrong-Password-2026!');
  await page.getByTestId('account-delete-confirm').click();
  await expect(
    page.getByText('The email or password is incorrect.', { exact: true }),
  ).toBeVisible();
  expect(backendDeletes).toBe(0);
  await fillField(page, 'account-delete-password', 'Soberity-Reset-2026!');
  await page.getByTestId('account-delete-confirm').click();
  await expect(page.getByTestId('welcome-sign-in')).toBeVisible();
  expect(backendDeletes).toBe(1);
  await page.getByTestId('welcome-sign-in').click();
  await fillField(page, 'sign-in-email', email);
  await fillField(page, 'sign-in-password', 'Soberity-Reset-2026!');
  await page.getByTestId('sign-in-submit').click();
  await expect(
    page.getByText('The email or password is incorrect.', { exact: true }),
  ).toBeVisible();
});

async function waitForOobCode(
  request: APIRequestContext,
  email: string,
  requestType: string,
): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await request.get(
      `${emulator}/emulator/v1/projects/${projectId}/oobCodes`,
    );
    expect(response.ok()).toBe(true);
    const payload = (await response.json()) as { oobCodes?: OobCode[] };
    const code = payload.oobCodes?.find(
      (item) => item.email === email && item.requestType === requestType,
    )?.oobCode;
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `Firebase Auth emulator did not issue ${requestType} for test account.`,
  );
}

async function fillField(page: Page, testId: string, value: string) {
  await page.getByTestId(testId).locator('input').fill(value);
}

async function installProfileApiFixture(
  page: Page,
  isVerified: () => boolean,
  initialProfile: ProfileShape,
  updateProfile: (next: ProfileShape) => void,
  isAvailable: () => boolean = () => true,
) {
  let currentProfile = initialProfile;
  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Authorization,Content-Type,Accept',
  };

  await page.route('**/api/v1/**', async (route) => {
    if (!isAvailable()) {
      await route.abort('connectionrefused');
      return;
    }
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (request.url().endsWith('/api/v1/identity/me')) {
      await route.fulfill({
        status: isVerified() ? 200 : 403,
        headers: corsHeaders,
        body: isVerified()
          ? '{"emailVerified":true}'
          : '{"detail":"Email verification is required."}',
      });
      return;
    }

    const method = request.method();
    if (method === 'POST' || method === 'PATCH') {
      const body = request.postDataJSON() as Partial<ProfileShape>;
      const next = { ...currentProfile, ...body };
      currentProfile = next;
      updateProfile(next);
      await route.fulfill({ status: 200, headers: corsHeaders, json: next });
      return;
    }
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: currentProfile,
      });
      return;
    }
    await route.fulfill({ status: 204, headers: corsHeaders });
  });
}
