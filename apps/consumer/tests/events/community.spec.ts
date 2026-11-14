import { expect, test } from '@playwright/test';
import { install, login } from './fixtures';
for (const language of ['en', 'pl'])
  for (const theme of ['light', 'dark']) {
    test(`Community navigation, data and unavailable modules ${language} ${theme}`, async ({
      page,
    }, info) => {
      await install(page, language, theme);
      await login(page);
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Otwórz menu' : 'Open menu',
          exact: true,
        })
        .click();
      await page
        .getByRole('link', { name: /Soberity \((community|społeczność)\)/ })
        .click();
      await expect(page).toHaveURL(/\/community$/);
      await expect(
        page.getByRole('heading', {
          name: language === 'pl' ? 'Społeczność' : 'Community',
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Sober Circles|Kręgi Sober/ }),
      ).toBeEnabled();
      await expect(
        page.getByRole('button', {
          name: /Science Discussions|Dyskusje naukowe/,
        }),
      ).toBeEnabled();
      await expect(
        page.getByRole('button', { name: /My Activities|Moje aktywności/ }),
      ).toBeDisabled();
      await expect(page.getByTestId('event-ticket')).toHaveCount(0);
      await expect(
        page.getByRole('button', {
          name: /Discover Events|Odkrywaj wydarzenia/,
        }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath('community.png'),
        fullPage: true,
      });
    });
  }
