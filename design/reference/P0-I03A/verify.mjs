/* global document, innerWidth, getComputedStyle, window */
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(
  new URL('../../../apps/consumer/package.json', import.meta.url),
);
const { chromium } = require('@playwright/test');
const palettes = JSON.parse(
  await readFile(new URL('./palettes.json', import.meta.url), 'utf8'),
);
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const luminance = (hex) => {
  const values = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (a, b) => {
  const l = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l[0] + 0.05) / (l[1] + 0.05);
};
const results = [];
for (const p of palettes) {
  const pairs = [
    ['primary/bg', p.primary, p.bg, 4.5],
    ['primary/alt', p.primary, p.alt, 4.5],
    ['primary/surface', p.primary, p.surface, 4.5],
    ['secondary/bg', p.secondary, p.bg, 4.5],
    ['secondary/alt', p.secondary, p.alt, 4.5],
    ['onPrimary/primary', p.onPrimary, p.primary, 4.5],
    ['focus/alt', p.pressed, p.alt, 3],
    ['text/surface', p.text, p.surface, 4.5],
    ['secondary/surface', p.secondary, p.surface, 4.5],
    ['muted/bg', p.muted, p.bg, 4.5],
  ];
  for (const [name, a, b, min] of pairs) {
    const ratio = contrast(a, b);
    if (ratio < min) throw new Error(`${p.id} ${name} contrast ${ratio}`);
    results.push(`${p.id} contrast ${name}: ${ratio.toFixed(2)}:1 PASS`);
  }
}
const browser = await chromium.launch();
try {
  for (const lang of ['pl', 'en'])
    for (const [device, width, height] of [
      ['desktop', 1440, 1100],
      ['mobile', 390, 844],
    ]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`http://127.0.0.1:4173/?screen=home&lang=${lang}`);
      for (const p of palettes) {
        await page.locator(`button[data-palette="${p.id}"]`).click();
        if ((await page.locator('body').getAttribute('data-palette')) !== p.id)
          throw new Error('Palette not applied');
        const primary = await page
          .locator('html')
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue('--primary').trim(),
          );
        if (primary !== p.primary) throw new Error('Wrong token');
        if (
          (await page.locator('body').getAttribute('data-theme')) !== p.scheme
        )
          throw new Error('Wrong color scheme');
        if (
          (await page
            .locator('button[data-palette][aria-pressed=true]')
            .count()) !== 1
        )
          throw new Error('Selection state');
        await page
          .locator('.news-art img')
          .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          )
        )
          throw new Error('Overflow');
        await page.locator('[data-news-filter="study"]').click();
        if ((await page.locator('.news-item:visible').count()) !== 2)
          throw new Error('Filter failure');
        await page.locator('[data-news-filter="all"]').click();
        await page.locator('[data-news="0"]').click();
        if (!(await page.locator('#detail').isVisible()))
          throw new Error('Reading panel');
        await page.keyboard.press('Escape');
        if (
          !(await page
            .locator('[data-news="0"]')
            .evaluate((el) => el === document.activeElement))
        )
          throw new Error('Focus restoration');
        await page.evaluate(() => {
          document.activeElement.blur();
          window.scrollTo(0, 0);
        });
        await page.mouse.move(0, 0);
        if (lang === 'pl')
          await page.screenshot({
            path: new URL(`${p.id}-${device}.png`, output).pathname,
            fullPage: true,
            animations: 'disabled',
            style: '*:focus-visible { outline: none !important; }',
          });
        await page.locator('#language').click();
        if ((await page.locator('body').getAttribute('data-palette')) !== p.id)
          throw new Error('Palette lost on language change');
        await page.locator('#language').click();
        for (const screen of ['science', 'events', 'home']) {
          await page.locator('#menu').click();
          await page.locator(`nav a[href*="screen=${screen}"]`).click();
          if (
            (await page.locator('body').getAttribute('data-palette')) !== p.id
          )
            throw new Error('Palette lost during navigation');
        }
        results.push(
          `${lang}/${device}/${p.id}: switch, CSS tokens, SVG decoding, filters, reading panel, focus, language + 3 routes retained palette, overflow PASS`,
        );
      }
      if (errors.length) throw new Error(errors.join('\n'));
      await page.close();
    }
  const filePage = await browser.newPage();
  await filePage.goto(new URL('./index.html?lang=pl', import.meta.url).href);
  await filePage.locator('button[data-palette="plum-soft"]').click();
  if (
    (await filePage.locator('body').getAttribute('data-palette')) !==
    'plum-soft'
  )
    throw new Error('Local file palette');
  results.push('Local file:// preview and palette switching PASS');
  await writeFile(
    new URL('./verification.txt', import.meta.url),
    results.join('\n') + '\n',
  );
  console.log(results.join('\n'));
} finally {
  await browser.close();
}
