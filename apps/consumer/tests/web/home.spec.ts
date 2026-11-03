import { expect, test } from '@playwright/test';

for (const language of ['en', 'pl'] as const) {
  for (const theme of ['dark', 'light'] as const) {
    test(`guest welcome ${language} ${theme}`, async ({ page }, testInfo) => {
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('@soberity/preferences/theme', theme);
          localStorage.setItem('@soberity/preferences/language', language);
        },
        { language, theme },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');

      await expect(
        page.getByRole('heading', {
          name:
            language === 'pl'
              ? /Więcej z życia\.\s*Razem\./
              : /More to life\.\s*Together\./,
        }),
      ).toBeVisible();
      await expect(page.getByTestId('welcome-sign-in')).toBeVisible();
      await expect(page.getByTestId('welcome-sign-up')).toBeVisible();
      await expect(page.getByTestId('home-for-you-today')).toHaveCount(0);
      await expect(page.getByTestId('home-latest-news')).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`guest-${language}-${theme}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }
}
