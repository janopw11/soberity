/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const api = 'http://127.0.0.1:8092';
const auth = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const password = 'Editorial-Test-2026!';
const database = process.env.SOBERITY_EDITORIAL_TEST_DB;
if (!database || !/^soberity_test_[a-z0-9_]+$/.test(database))
  throw new Error(
    'Set SOBERITY_EDITORIAL_TEST_DB to an isolated soberity_test_ database.',
  );
async function account(
  request: APIRequestContext,
  role: string | null,
  locale = 'en',
) {
  const email = `editor-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const created = await request.post(
    `${auth}/accounts:signUp?key=demo-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  expect(created.ok()).toBeTruthy();
  const { localId } = (await created.json()) as { localId: string };
  if (!/^[a-zA-Z0-9_-]+$/.test(localId))
    throw new Error('Unexpected emulator UID');
  const verified = await request.post(
    `${auth}/accounts:update?key=demo-api-key`,
    {
      headers: { Authorization: 'Bearer owner' },
      data: { localId, emailVerified: true },
    },
  );
  expect(verified.ok()).toBeTruthy();
  if (role) {
    if (!['AUTHOR', 'REVIEWER'].includes(role))
      throw new Error('Invalid test role');
    execFileSync(
      process.env.SOBERITY_TEST_PSQL ?? 'psql',
      [
        '-h',
        '127.0.0.1',
        '-p',
        '25439',
        '-U',
        'soberity_test',
        '-d',
        database!,
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `INSERT INTO editorial_role(firebase_uid,role,granted_by) VALUES ('${localId}','${role}','browser-test-operator')`,
      ],
      { stdio: 'pipe' },
    );
  }
  const signed = await request.post(
    `${auth}/accounts:signInWithPassword?key=demo-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  const { idToken } = (await signed.json()) as { idToken: string };
  const headers = { Authorization: `Bearer ${idToken}` };
  expect(
    (
      await request.post(`${api}/api/v1/me`, {
        headers,
        data: { initialLocale: locale },
      })
    ).ok(),
  ).toBeTruthy();
  return { email, idToken, localId };
}
async function login(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByTestId('sign-in-email').getByRole('textbox').fill(email);
  await page.getByTestId('sign-in-password').locator('input').fill(password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/editorial');
}
async function logout(page: Page) {
  await page.goto('/account');
  await page.getByTestId('account-sign-out').click();
}
async function fill(page: Page, key: string, value: string) {
  await page
    .getByTestId(`editorial-field-${key}`)
    .getByRole('textbox')
    .fill(value);
}
for (const locale of ['en', 'pl'] as const) {
  test(`${locale}: author, independent reviewer, publication and withdrawal with real backend`, async ({
    page,
    request,
  }, info) => {
    const pl = locale === 'pl';
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('non-boolean'))
        console.log(message.text());
    });
    const author = await account(request, 'AUTHOR', locale),
      reviewer = await account(request, 'REVIEWER', locale);
    await page.addInitScript(
      (theme) => localStorage.setItem('@soberity/preferences/theme', theme),
      pl ? 'light' : 'dark',
    );
    await login(page, author.email);
    await page
      .getByRole('button', {
        name: pl ? 'Utwórz szkic' : 'Create draft',
        exact: true,
      })
      .click();
    const title = `Synthetic browser fixture ${Date.now()}`;
    for (const key of [
      'claimText',
      'summary',
      'evidenceRationale',
      'limitations',
      'uncertainty',
      'population',
      'exposure',
      'outcome',
      'changeSummary',
    ])
      await fill(page, key, key === 'claimText' ? title : `Synthetic ${key}`);
    await page
      .getByRole('button', {
        name: pl ? 'Zapisz szkic' : 'Save draft',
        exact: true,
      })
      .click();
    await expect(page.getByTestId('editorial-detail')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: pl ? 'Wyślij do recenzji' : 'Submit for review',
        exact: true,
      }),
    ).toBeDisabled();
    await page
      .getByRole('button', {
        name: pl ? 'Dodaj metadane źródła' : 'Add source metadata',
        exact: true,
      })
      .click();
    for (const [key, value] of Object.entries({
      title: 'Synthetic source, not a real publication',
      authors: 'Fixture institution',
      publicationYear: '2025',
      url: 'https://example.test/synthetic',
    }))
      await fill(page, key, value);
    await page
      .getByRole('button', {
        name: pl ? 'Zapisz metadane źródła' : 'Save source metadata',
        exact: true,
      })
      .click();
    await fill(page, 'notes', 'Synthetic assessment');
    await page
      .getByRole('button', {
        name: pl ? 'Dołącz źródło' : 'Attach source',
        exact: true,
      })
      .click();
    await expect(
      page
        .getByText('Synthetic source, not a real publication', { exact: false })
        .first(),
    ).toBeVisible();
    await fill(page, 'reason', 'Ready for independent assessment');
    await page
      .getByRole('button', {
        name: pl ? 'Wyślij do recenzji' : 'Submit for review',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('button', {
        name: pl ? 'Zatwierdź wersję' : 'Approve version',
        exact: true,
      }),
    ).toHaveCount(0);
    await logout(page);
    await login(page, reviewer.email);
    await page.getByRole('button', { name: new RegExp(title) }).click();
    await expect(
      page.getByText('Synthetic limitations', { exact: true }),
    ).toBeVisible();
    const approve = page.getByRole('button', {
      name: pl ? 'Zatwierdź wersję' : 'Approve version',
      exact: true,
    });
    await expect(approve).toBeDisabled();
    await fill(page, 'notes', 'Independently reviewed synthetic evidence');
    const acknowledgement = page.getByRole('checkbox', {
      name: pl
        ? 'Sprawdzono całą treść, źródła, niepewność, ograniczenia i prawa do wykorzystania.'
        : 'I checked the full text, sources, uncertainty, limitations and reuse rights.',
    });
    await page.keyboard.press('Tab');
    await expect(acknowledgement).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(acknowledgement).toBeChecked();
    await approve.click();
    await fill(page, 'reason', 'Reviewed publication');
    await page
      .getByRole('button', {
        name: pl ? 'Opublikuj zatwierdzoną wersję' : 'Publish approved version',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: pl ? 'Potwierdź operację' : 'Confirm operation',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(pl ? 'Opublikowane · v1' : 'Published · v1', {
        exact: true,
      }),
    ).toBeVisible();
    const materials = await request.get(
      `${api}/api/v1/editorial/materials?type=CLAIM`,
      { headers: { Authorization: `Bearer ${reviewer.idToken}` } },
    );
    const items = (await materials.json()).items as {
      id: string;
      material_id: string;
      title: string;
    }[];
    const material = items.find((i) => i.title === title)!;
    expect(material).toBeTruthy();
    expect(
      (
        await request.get(
          `${api}/api/v1/evidence/claims/${material.material_id}`,
        )
      ).status(),
    ).toBe(200);
    await expect(
      page.getByRole('button', {
        name: pl ? 'Potwierdź operację' : 'Confirm operation',
        exact: true,
      }),
    ).toBeHidden();
    await page
      .getByRole('heading', {
        name: pl ? 'Panel redakcyjny' : 'Editorial workspace',
        exact: true,
      })
      .last()
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`editorial-${locale}.png`),
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await fill(page, 'reason', 'Synthetic withdrawal');
    await page
      .getByRole('button', {
        name: pl ? 'Wycofaj materiał' : 'Withdraw material',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: pl ? 'Potwierdź operację' : 'Confirm operation',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(pl ? 'Zarchiwizowane · v1' : 'Archived · v1', {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      (
        await request.get(
          `${api}/api/v1/evidence/claims/${material.material_id}`,
        )
      ).status(),
    ).toBe(404);
    await expect(
      page.getByText('Synthetic withdrawal', { exact: true }),
    ).toBeVisible();
  });
}
test('guest guard and ordinary member cannot access editorial materials', async ({
  page,
  request,
}) => {
  await page.goto('/editorial');
  await expect(page.getByTestId('welcome-sign-in')).toBeVisible();
  const member = await account(request, null);
  await login(page, member.email);
  await expect(
    page.getByText('This workspace requires editorial access.'),
  ).toBeVisible();
  await expect(page.getByTestId('editorial-draft-form')).toHaveCount(0);
  expect(
    (
      await request.get(`${api}/api/v1/editorial/materials`, {
        headers: { Authorization: `Bearer ${member.idToken}` },
      })
    ).status(),
  ).toBe(403);
});

test('article creation, separate review and correction preserve immutable versions', async ({
  page,
  request,
}) => {
  const author = await account(request, 'AUTHOR'),
    reviewer = await account(request, 'REVIEWER');
  const authorHeaders = { Authorization: `Bearer ${author.idToken}` };
  const reviewerHeaders = { Authorization: `Bearer ${reviewer.idToken}` };
  async function post(path: string, body: unknown, reviewerRole = false) {
    const result = await request.post(`${api}/api/v1/editorial${path}`, {
      headers: reviewerRole ? reviewerHeaders : authorHeaders,
      data: body,
    });
    expect(result.ok(), `Editorial fixture ${path}`).toBeTruthy();
    return result.status() === 204
      ? null
      : ((await result.json()) as { id: string });
  }
  const claim = (await post('/claims', {
    locale: 'en',
    category: 'brain',
    changeSummary: 'Synthetic fixture',
    nextReviewAt: '2027-11-03T00:00:00Z',
    content: {
      claimText: 'Synthetic article evidence',
      summary: 'Synthetic summary',
      evidenceLevel: 'LOW',
      evidenceRationale: 'Synthetic rationale',
      limitations: 'Synthetic limitations',
      uncertainty: 'Synthetic uncertainty',
      population: 'Fixture population',
      exposure: 'Fixture exposure',
      outcome: 'Fixture outcome',
      inferenceType: 'ASSOCIATION',
      causalJustification: null,
    },
  }))!;
  const source = (await post('/sources', {
    title: 'Synthetic source',
    authors: 'Fixture institution',
    publicationYear: 2025,
    url: 'https://example.test/article',
    studyType: 'REPORT',
    provider: 'OTHER',
    license: 'UNKNOWN',
    accessType: 'ABSTRACT_ONLY',
  }))!;
  await post(`/claims/${claim.id}/citations`, {
    sourceId: source.id,
    relation: 'SUPPORTS',
    notes: 'Synthetic assessment',
  });
  await post(`/materials/CLAIM/${claim.id}/submit`, {
    reason: 'Review fixture',
  });
  await post(
    `/materials/CLAIM/${claim.id}/review`,
    {
      decision: 'APPROVED',
      notes: 'Independent fixture assessment',
      causalityApproved: false,
    },
    true,
  );
  await post(
    `/materials/CLAIM/${claim.id}/publish`,
    { reason: 'Publish fixture' },
    true,
  );
  await login(page, author.email);
  await page
    .getByLabel('Material type', { exact: true })
    .selectOption('ARTICLE');
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  const title = `Synthetic article ${Date.now()}`;
  for (const [key, value] of Object.entries({
    revisionId: claim.id,
    title,
    summary: 'Synthetic article summary',
    body: 'Original synthetic article body',
    changeSummary: 'First article',
  }))
    await fill(page, key, value);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByTestId('editorial-detail')).toBeVisible();
  await fill(page, 'reason', 'Review full article');
  await page
    .getByRole('button', { name: 'Submit for review', exact: true })
    .click();
  await logout(page);
  await login(page, reviewer.email);
  await page
    .getByLabel('Material type', { exact: true })
    .selectOption('ARTICLE');
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await fill(page, 'notes', 'Full article independently reviewed');
  await page.getByRole('checkbox').click();
  await page
    .getByRole('button', { name: 'Approve version', exact: true })
    .click();
  await fill(page, 'reason', 'Publish reviewed article');
  await page
    .getByRole('button', { name: 'Publish approved version', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirm operation', exact: true })
    .click();
  await expect(page.getByText('Published · v1', { exact: true })).toBeVisible();
  await logout(page);
  await login(page, author.email);
  await page
    .getByLabel('Material type', { exact: true })
    .selectOption('ARTICLE');
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await page
    .getByRole('button', { name: 'Create a new version', exact: true })
    .click();
  await expect(
    page.getByTestId('editorial-field-body').getByRole('textbox'),
  ).toHaveValue('Original synthetic article body');
  await fill(page, 'body', 'Corrected synthetic article body');
  await fill(page, 'changeSummary', 'Synthetic correction');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByText('Draft · v2', { exact: true })).toBeVisible();
  await expect(
    page.getByText('This article version has not been approved.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Publish approved version', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'v1 · Published', exact: true })
    .click();
  await expect(
    page.getByText('Original synthetic article body', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Corrected synthetic article body', { exact: true }),
  ).toHaveCount(0);
});
