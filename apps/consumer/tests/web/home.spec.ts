import { expect, test } from '@playwright/test';

for (const language of ['en', 'pl'] as const) {
  for (const theme of ['dark', 'light'] as const) {
    test(`home feed ${language} ${theme}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        locale: language === 'pl' ? 'pl-PL' : 'en-GB',
        viewport:
          testInfo.project.name === 'mobile-web'
            ? { width: 390, height: 844 }
            : { width: 1280, height: 900 },
      });
      try {
        await context.addInitScript(
          ({ language, theme }) => {
            localStorage.setItem('@soberity/preferences/theme', theme);
            localStorage.setItem('@soberity/preferences/language', language);
          },
          { language, theme },
        );
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/');
        await expect(
          page.getByRole('heading', {
            name:
              language === 'pl' ? 'Witaj w Soberity' : 'Welcome to Soberity',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole('heading', {
            name: language === 'pl' ? 'Najnowsze wiadomości' : 'Latest news',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByTestId('news-preview-notice')).toContainText(
          language === 'pl' ? 'Przykładowe artykuły' : 'Sample articles',
        );
        await expect(
          page.getByTestId(/^news-(sleep|evidence|habits|headlines)$/),
        ).toHaveCount(4);
        await expect(page.getByTestId('news-sleep')).toContainText(
          language === 'pl' ? 'Omówienie badań' : 'Research overview',
        );
        await expect(page.getByTestId('news-evidence')).toContainText(
          language === 'pl' ? 'Artykuł' : 'Article',
        );
        await page.getByTestId('news-headlines').scrollIntoViewIfNeeded();
        await expect(page.getByTestId('news-headlines')).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await page
          .getByRole('heading', {
            name:
              language === 'pl' ? 'Witaj w Soberity' : 'Welcome to Soberity',
            exact: true,
          })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(`home-${language}-${theme}.png`),
          fullPage: true,
        });
        // Narrow screens keep the full text and remove decorative thumbnails.
        await page.setViewportSize({ width: 320, height: 740 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await expect(page.getByTestId('news-headlines')).toContainText(
          language === 'pl' ? 'Poza nagłówkiem' : 'Behind the headline',
        );
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
}
