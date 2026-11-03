/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
const png = readFileSync(
  new URL('../../assets/images/world-map-earth.png', import.meta.url),
);
const uid = 'blog-ui-author';
const token = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email: 'editor@example.test', email_verified: true, aud: 'demo-soberity', iss: 'https://securetoken.google.com/demo-soberity', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: 'password' } })).toString('base64url')}.test-only`;
async function fixture(
  page: Page,
  locale = 'en',
  roles = ['AUTHOR'],
  reviewing = false,
) {
  let saved: Record<string, unknown> | null = reviewing
    ? {
        id: '20000000-0000-4000-8000-000000000001',
        revision_id: 'review-version',
        version: 1,
        author_uid: 'another-author',
        kind: 'ARTICLE',
        title: 'Review this article',
        document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Synthetic article under review' },
              ],
            },
          ],
        },
        evidence: [
          { title: 'Synthetic source', url: 'https://example.test/evidence' },
        ],
        category_code: 'sleep',
        cover_id: null,
        status: 'IN_REVIEW',
        created_at: '2026-11-03T12:00:00Z',
        updated_at: '2026-11-03T13:00:00Z',
        published_at: null,
        publication_route: 'AUTHOR',
        review_notes: null,
        history: [],
      }
    : null;
  let uploads = 0;
  const writes: Record<string, unknown>[] = [];
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  };
  await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    await route.fulfill({
      headers: cors,
      json: route.request().url().includes('accounts:lookup')
        ? {
            users: [
              {
                localId: uid,
                email: 'editor@example.test',
                emailVerified: true,
                passwordUpdatedAt: 0,
                lastLoginAt: String(Date.now()),
                createdAt: String(Date.now()),
              },
            ],
          }
        : {
            localId: uid,
            email: 'editor@example.test',
            idToken: token,
            refreshToken: 'test-refresh',
            expiresIn: '3600',
            registered: true,
          },
    });
  });
  const categories = [{ code: 'sleep', label_en: 'Sleep', label_pl: 'Sen' }];
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    const path = new URL(request.url()).pathname;
    let result: unknown = {};
    if (path === '/api/v1/identity/me') result = { uid, emailVerified: true };
    else if (path === '/api/v1/me')
      result = {
        id: 'profile',
        displayName: 'Editor',
        city: null,
        interests: [],
        locale,
        updatedAt: new Date().toISOString(),
      };
    else if (path === '/api/v1/editorial/me') result = { uid, roles };
    else if (path === '/api/v1/editorial/categories') {
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as { name: string };
        categories.push({
          code: 'new-category',
          label_en: body.name,
          label_pl: body.name,
        });
        result = categories.at(-1);
      } else result = categories;
    } else if (path === '/api/v1/editorial/media') {
      uploads++;
      result = {
        id: `10000000-0000-4000-8000-${String(uploads).padStart(12, '0')}`,
        url: `/api/v1/science/media/10000000-0000-4000-8000-${String(uploads).padStart(12, '0')}`,
        width: 1600,
        height: 900,
        alt: 'Test image',
      };
    } else if (path.startsWith('/api/v1/editorial/media/')) {
      await route.fulfill({
        headers: { ...cors, 'Content-Type': 'image/jpeg' },
        body: png,
      });
      return;
    } else if (path === '/api/v1/editorial/posts' && request.method() === 'GET')
      result = {
        items: saved ? [saved] : [],
        page: 0,
        size: 30,
        total: saved ? 1 : 0,
      };
    else if (path.endsWith('/decision')) {
      const body = request.postDataJSON() as Record<string, unknown>;
      writes.push(body);
      saved = {
        ...saved,
        status: body.decision === 'PUBLISH' ? 'PUBLISHED' : 'ARCHIVED',
        review_notes: body.notes,
        publication_route: 'REVIEWED',
      };
      result = saved;
    } else if (
      path.startsWith('/api/v1/editorial/posts') &&
      ['POST', 'PUT'].includes(request.method())
    ) {
      const body = request.postDataJSON() as Record<string, unknown>;
      writes.push(body);
      saved = {
        id: '20000000-0000-4000-8000-000000000001',
        revision_id: 'revision',
        version: writes.length,
        author_uid: uid,
        kind: body.kind,
        title: body.title,
        document: body.document,
        evidence: body.evidence,
        category_code: body.categoryCode,
        cover_id: body.coverId,
        cover_alt: 'Test cover',
        status:
          body.action === 'PUBLISH'
            ? 'PUBLISHED'
            : body.action === 'REVIEW'
              ? 'IN_REVIEW'
              : 'DRAFT',
        created_at: '2026-11-03T12:00:00Z',
        updated_at: '2026-11-03T13:00:00Z',
        published_at: body.action === 'PUBLISH' ? '2026-11-03T13:00:00Z' : null,
        publication_route: 'AUTHOR',
        review_notes: null,
        history: [
          {
            version: writes.length,
            status: 'DRAFT',
            created_at: '2026-11-03T12:00:00Z',
          },
        ],
      };
      result = saved;
    } else if (path.startsWith('/api/v1/editorial/posts/')) result = saved;
    await route.fulfill({ headers: cors, json: result });
  });
  await page.addInitScript(
    (theme) => {
      if (window === window.top)
        localStorage.setItem('@soberity/preferences/theme', theme);
    },
    locale === 'pl' ? 'light' : 'dark',
  );
  await page.goto('/sign-in');
  await page
    .getByTestId('sign-in-email')
    .getByRole('textbox')
    .fill('editor@example.test');
  await page
    .getByTestId('sign-in-password')
    .locator('input')
    .fill('Test-Only-Password!');
  await page.getByTestId('sign-in-submit').click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/editorial');
  return writes;
}
for (const locale of ['en', 'pl'])
  test(`${locale}: blog editor formatting, sources, categories, images and direct publication`, async ({
    page,
  }, info) => {
    const pl = locale === 'pl';
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const writes = await fixture(page, locale);
    await expect(
      page.getByRole('button', { name: /Refresh workspace|Odśwież panel/ }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Review evidence, keep a clear publication history.'),
    ).toHaveCount(0);
    await page
      .getByRole('button', {
        name: pl ? 'Utwórz szkic' : 'Create draft',
        exact: true,
      })
      .click();
    await expect(
      page.getByLabel(pl ? 'Język treści' : 'Content language', {
        exact: true,
      }),
    ).toHaveCount(0);
    await page
      .getByLabel(pl ? 'Tytuł' : 'Title', { exact: true })
      .fill('A quieter kind of evening');
    const content = page.getByRole('textbox', {
      name: pl ? 'Treść artykułu' : 'Article content',
      exact: true,
    });
    await content.click();
    await page
      .getByRole('button', { name: pl ? 'Pogrubienie' : 'Bold', exact: true })
      .click();
    await page.keyboard.type('A clear beginning');
    await expect(content.locator('strong')).toContainText('A clear beginning');
    await page
      .getByRole('button', { name: pl ? 'Wyjustuj' : 'Justify', exact: true })
      .click();
    await expect(content.locator('p').first()).toHaveCSS(
      'text-align',
      'justify',
    );
    await page
      .getByRole('button', {
        name: pl ? 'Dodaj źródło' : 'Add source',
        exact: true,
      })
      .click();
    await page
      .getByLabel(pl ? 'Tytuł źródła' : 'Source title', { exact: true })
      .fill('Synthetic evidence');
    await page
      .getByLabel(pl ? 'Adres źródła (HTTPS)' : 'Source URL (HTTPS)', {
        exact: true,
      })
      .fill('https://example.test/evidence');
    await page
      .getByRole('button', {
        name: pl ? 'Nowa kategoria' : 'New category',
        exact: false,
      })
      .click();
    await page
      .getByLabel(pl ? 'Nazwa kategorii' : 'Category name')
      .fill('Culture & connection');
    await page
      .getByRole('button', {
        name: pl ? 'Dodaj kategorię' : 'Add category',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('combobox', {
        name: pl ? 'Kategoria' : 'Category',
        exact: true,
      }),
    ).toHaveValue('new-category');
    for (const mode of ['COVER', 'INLINE']) {
      await page
        .getByRole('button', {
          name:
            mode === 'COVER'
              ? pl
                ? 'Dodaj obraz'
                : 'Add image'
              : pl
                ? 'Wstaw obraz do treści'
                : 'Insert image in content',
          exact: true,
        })
        .click();
      await page.getByLabel(pl ? 'Plik obrazu' : 'Image file').setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: png,
      });
      await page
        .getByLabel(
          pl
            ? 'Opis obrazu (tekst alternatywny)'
            : 'Image description (alt text)',
        )
        .fill(mode === 'COVER' ? 'Test cover' : 'Test inline image');
      await page
        .getByRole('button', {
          name: pl ? 'Wgraj obraz' : 'Upload image',
          exact: true,
        })
        .click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await expect(content.locator('img')).toHaveCount(1);
    await page
      .getByRole('button', {
        name: pl ? 'Zapisz szkic' : 'Save draft',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(pl ? 'Szkic zapisany.' : 'Draft saved.', { exact: true }),
    ).toBeVisible();
    expect(writes[0]?.evidence).toEqual([
      { title: 'Synthetic evidence', url: 'https://example.test/evidence' },
    ]);
    expect(writes[0]?.categoryCode).toBe('new-category');
    expect(JSON.stringify(writes[0]?.document)).toContain(
      '/api/v1/science/media/',
    );
    expect(JSON.stringify(writes[0]?.document)).not.toContain('blob:');
    await page
      .getByRole('button', { name: pl ? 'Opublikuj' : 'Publish', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByRole('button', {
        name: pl ? 'Potwierdź operację' : 'Confirm operation',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(pl ? 'Artykuł opublikowany.' : 'Article published.', {
        exact: true,
      }),
    ).toBeVisible();
    expect(writes.at(-1)?.action).toBe('PUBLISH');
    expect(errors).toEqual([]);
    await expect(
      page.getByText(
        pl
          ? 'Opublikowane bezpośrednio przez autora'
          : 'Published directly by the author',
        { exact: true },
      ),
    ).toBeVisible();
    await page.locator('main.ew').evaluate((element) => element.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`workspace-${locale}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  });
test('send for review is a separate author action', async ({ page }) => {
  const writes = await fixture(page);
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Review this story');
  await page
    .getByRole('textbox', { name: 'Article content', exact: true })
    .fill('Text for independent review');
  await page.getByRole('button', { name: 'Add source', exact: false }).click();
  await page
    .getByLabel('Source title', { exact: true })
    .fill('Synthetic evidence');
  await page
    .getByLabel('Source URL (HTTPS)', { exact: true })
    .fill('https://example.test/source');
  await page
    .getByRole('button', { name: 'Send for review', exact: true })
    .click();
  await expect(
    page.getByText('Article sent for review.', { exact: true }),
  ).toBeVisible();
  expect(writes.at(-1)?.action).toBe('REVIEW');
});

test('reviewer feedback remains visible after requesting changes', async ({
  page,
}) => {
  const writes = await fixture(page, 'en', ['REVIEWER'], true);
  await expect(
    page.getByRole('button', { name: 'Create draft', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Review this article/ }).click();
  await expect(
    page.getByRole('button', { name: 'Publish', exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel('Assessment notes', { exact: true })
    .fill('Clarify the limitations of the cited evidence.');
  await page
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  await expect(
    page.getByText('Clarify the limitations of the cited evidence.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(writes.at(-1)?.decision).toBe('CHANGES_REQUESTED');
});
