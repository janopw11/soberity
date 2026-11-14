import { expect, test, type Page } from '@playwright/test';
import { install, login } from './fixtures';
const id = '60000000-0000-4000-8000-000000000001',
  articleId = '60000000-0000-4000-8000-000000000002';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
type Comment = {
  id: string;
  parent_id: string | null;
  content: string;
  kind: string;
  status: string;
  author_name: string;
  own: boolean;
  created_at: string;
  reply_count: number;
};
async function fixture(page: Page, { admin = false, existing = true } = {}) {
  let enabled = existing,
    failed = false,
    title = 'Fixture article discussion',
    status = 'OPEN',
    version = 1;
  const comments: Comment[] = [];
  const topic = () => ({
    id,
    title,
    status,
    version,
    article_type: 'POST',
    article_id: articleId,
    article_title: 'Fixture educational article',
    category_code: 'sleep',
    comment_count: comments.filter((c) => c.status === 'VISIBLE').length,
    latest_activity: '2026-11-13T12:00:00Z',
    can_moderate: admin,
  });
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace('/api/v1', ''),
      method = req.method();
    const handled =
      path.includes('discussion') ||
      path === '/science/feed' ||
      path === '/science/categories' ||
      path.startsWith('/science/posts/') ||
      path === '/editorial/me';
    if (!handled) return route.fallback();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const respond = (json: unknown, status = 200) =>
      route.fulfill({ headers, json, status });
    const pageItems = (items: unknown[]) => {
      const page = Number(url.searchParams.get('page') ?? 0),
        size = Number(url.searchParams.get('size') ?? 20);
      return {
        items: items.slice(page * size, (page + 1) * size),
        total: items.length,
        page,
        size,
      };
    };
    if (path === '/editorial/me')
      return respond({ roles: admin ? ['REVIEWER'] : [] });
    if (path === '/science/categories')
      return respond([
        { code: 'sleep', label: 'Sleep' },
        { code: 'brain', label: 'Brain' },
      ]);
    if (path === '/science/feed')
      return respond(
        pageItems([
          {
            type: 'POST',
            content: { id: articleId, title: 'Fixture educational article' },
          },
        ]),
      );
    if (path === `/science/posts/${articleId}`)
      return respond({
        id: articleId,
        title: 'Fixture educational article',
        document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Synthetic educational content for UI testing.',
                },
              ],
            },
          ],
        },
        published_at: '2026-11-13T12:00:00Z',
        publication_route: 'AUTHOR',
        evidence: [
          { title: 'Fixture source', url: 'https://example.test/source' },
        ],
      });
    if (path.startsWith('/editorial/') && !admin) return respond({}, 403);
    if (path === '/editorial/discussions' && method === 'POST') {
      const body = req.postDataJSON();
      enabled = true;
      title = body.title;
      status = body.status;
      return respond({ id }, 201);
    }
    if (path === `/editorial/discussions/${id}` && method === 'PUT') {
      const body = req.postDataJSON();
      expect(body.expectedVersion).toBe(version);
      version++;
      title = body.title;
      status = body.status;
      return respond({ id });
    }
    if (path.includes('discussion-comments/')) {
      const comment = comments.find((c) => c.id === path.split('/').at(-1))!;
      if (method === 'DELETE') {
        comment.status = 'DELETED';
        comment.content = '';
      } else {
        comment.status = req.postDataJSON().status;
        if (comment.status === 'REMOVED') comment.content = '';
      }
      return route.fulfill({ status: 204, headers });
    }
    if (path === `/me/discussions/${id}/comments` && method === 'POST') {
      expect(req.headers().authorization).toMatch(/^Bearer /);
      const body = req.postDataJSON();
      comments.push({
        id: `70000000-0000-4000-8000-${String(comments.length + 1).padStart(12, '0')}`,
        parent_id: body.parentId,
        content: body.content,
        kind: body.kind,
        status: 'VISIBLE',
        author_name: 'Fixture member',
        own: true,
        created_at: '2026-11-13T12:00:00Z',
        reply_count: 0,
      });
      return respond({ id: comments.at(-1)!.id }, 201);
    }
    if (path.endsWith('/comments')) {
      const parent = url.searchParams.get('parentId');
      return respond(
        pageItems(
          comments
            .filter((c) => c.parent_id === parent)
            .map((c) => ({
              ...c,
              content:
                c.status === 'VISIBLE' || path.startsWith('/editorial')
                  ? c.content
                  : '',
              reply_count: comments.filter((r) => r.parent_id === c.id).length,
            })),
        ),
      );
    }
    if (path.endsWith(`/${id}`)) return respond(topic());
    if (failed) return respond({}, 503);
    const q = url.searchParams.get('q') ?? '',
      category = url.searchParams.get('category');
    return respond(
      pageItems(
        enabled &&
          title.toLowerCase().includes(q.toLowerCase()) &&
          (!category || category === 'sleep')
          ? [topic()]
          : [],
      ),
    );
  });
  return {
    comments,
    fail: (value: boolean) => {
      failed = value;
    },
    topic,
  };
}
for (const language of ['en', 'pl'])
  for (const theme of ['light', 'dark']) {
    test(`article discussion comment reply delete ${language} ${theme}`, async ({
      page,
    }, info) => {
      await install(page, language, theme);
      await fixture(page);
      await login(page);
      await page.goto('/community');
      await page
        .getByRole('link', { name: /Fixture article discussion/ })
        .click();
      await expect(page).toHaveURL(new RegExp(`/discussions/${id}`));
      await expect(
        page.getByRole('alert').filter({
          hasText: language === 'pl' ? 'osobiste opinie' : 'personal opinions',
        }),
      ).toBeVisible();
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Dodaj komentarz' : 'Add a comment',
          exact: true,
        })
        .fill('My perspective <script>window.injected=true</script>');
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Opublikuj komentarz' : 'Post comment',
          exact: true,
        })
        .click();
      await expect(
        page.getByText('My perspective <script>window.injected=true</script>', {
          exact: true,
        }),
      ).toBeVisible();
      expect(await page.evaluate(() => Object.hasOwn(window, 'injected'))).toBe(
        false,
      );
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Odpowiedz' : 'Reply',
          exact: true,
        })
        .click();
      await page
        .getByRole('textbox', {
          name: language === 'pl' ? 'Twoja odpowiedź' : 'Your reply',
          exact: true,
        })
        .fill('My reply');
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Opublikuj komentarz' : 'Post comment',
          exact: true,
        })
        .last()
        .click();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Pokaż 1 odpowiedź' : 'Show 1 reply',
          exact: true,
        })
        .click();
      await expect(page.getByText('My reply', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: language === 'pl' ? 'Odpowiedz' : 'Reply',
          exact: true,
        }),
      ).toHaveCount(1);
      await page.screenshot({
        path: info.outputPath('discussion.png'),
        fullPage: true,
      });
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Usuń mój komentarz' : 'Delete my comment',
          exact: true,
        })
        .first()
        .click();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Potwierdź usunięcie' : 'Confirm deletion',
          exact: true,
        })
        .click();
      await expect(
        page.getByText('My perspective <script>window.injected=true</script>', {
          exact: true,
        }),
      ).toHaveCount(0);
      await page
        .getByRole('button', {
          name: 'Fixture educational article',
          exact: true,
        })
        .click();
      await expect(
        page.getByText('Synthetic educational content for UI testing.', {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole('button', {
          name:
            language === 'pl'
              ? 'Przejdź do dyskusji · 1 komentarz'
              : 'Join the discussion · 1 comment',
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(new RegExp(`/discussions/${id}`));
    });
  }
test('directory search filters sorting and retry', async ({ page }) => {
  await install(page);
  const state = await fixture(page);
  await page.goto('/discussions');
  const search = page.getByRole('textbox', {
    name: 'Search discussions',
    exact: true,
  });
  await search.fill('missing');
  await page
    .getByRole('button', { name: 'Search discussions', exact: true })
    .click();
  await expect(
    page.getByText('No discussions yet for these filters.', { exact: true }),
  ).toBeVisible();
  await search.fill('Fixture');
  await page
    .getByRole('button', { name: 'Search discussions', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Educational topic', exact: true })
    .selectOption('brain');
  await expect(
    page.getByText('No discussions yet for these filters.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Educational topic', exact: true })
    .selectOption('sleep');
  await page
    .getByRole('combobox', { name: 'Sort by', exact: true })
    .selectOption('POPULAR');
  await expect(
    page.getByRole('link', { name: /Fixture article discussion/ }),
  ).toBeVisible();
  state.fail(true);
  await page.reload();
  await expect(
    page.getByText('Discussions could not be loaded. Please try again.', {
      exact: true,
    }),
  ).toBeVisible();
  state.fail(false);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('link', { name: /Fixture article discussion/ }),
  ).toBeVisible();
});
test('guest reads discussion and is asked to sign in before commenting', async ({
  page,
}) => {
  await install(page);
  await fixture(page);
  await page.goto(`/discussions/${id}`);
  await expect(
    page.getByRole('button', { name: 'Sign in to comment', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Add a comment', exact: true }),
  ).toHaveCount(0);
});
test('editorial reviewer creates topic and moderates comments', async ({
  page,
}, info) => {
  await install(page);
  const state = await fixture(page, { admin: true, existing: false });
  await login(page);
  await page.goto('/editorial-discussions');
  await page
    .getByRole('textbox', { name: 'Discussion title', exact: true })
    .fill('Managed discussion');
  await page
    .getByRole('button', { name: 'Fixture educational article', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Save discussion', exact: true })
    .click();
  await expect(
    page.getByText('Discussion saved.', { exact: true }),
  ).toBeVisible();
  state.comments.push({
    id: '70000000-0000-4000-8000-000000000001',
    parent_id: null,
    content: 'Moderate this fixture',
    kind: 'EXPERIENCE',
    status: 'VISIBLE',
    author_name: 'Fixture member',
    own: false,
    created_at: '2026-11-13T12:00:00Z',
    reply_count: 0,
  });
  await page
    .getByRole('button', { name: 'Manage: Managed discussion', exact: true })
    .click();
  await page.getByRole('button', { name: 'Hide comment', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Restore comment', exact: true }),
  ).toBeVisible();
  expect(state.topic().comment_count).toBe(0);
  await page
    .getByRole('button', { name: 'Restore comment', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Hide comment', exact: true }),
  ).toBeVisible();
  expect(state.topic().comment_count).toBe(1);
  await page
    .getByRole('button', { name: 'Permanently remove', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirm deletion', exact: true })
    .click();
  await expect(
    page.getByText('Moderate this fixture', { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('discussion-admin.png'),
    fullPage: true,
  });
  await page
    .getByRole('combobox', { name: 'Discussion status', exact: true })
    .selectOption('CLOSED');
  await page
    .getByRole('button', { name: 'Save discussion', exact: true })
    .click();
  await expect(
    page.getByText('Discussion saved.', { exact: true }),
  ).toBeVisible();
  expect(state.topic().status).toBe('CLOSED');
});
