// Renders the PWA and Apple icons from public/favicon.svg (the BrandMark logo) so they always match.
// Run after changing the logo: npm run icons   (needs: npx playwright install chromium)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

// PNG icons use the light-theme colours, so the dark-mode <style> is dropped.
const favicon = readFileSync('public/favicon.svg', 'utf8')
  .replace(/<!--[\s\S]*?-->\s*/, '')
  .replace(/<style>[\s\S]*?<\/style>/, '');

// Full-bleed variant for maskable and Apple icons: square background (the platform rounds it)
// and the mark scaled into the maskable safe zone (centre 80 %), centred on its own bounds.
const [, bg] = /<rect[^>]*fill="([^"]+)"/.exec(favicon);
const mark = favicon
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<rect[^>]*\/>/, '');
const fullBleed =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/>` +
  `<g transform="translate(16 16) scale(0.72) translate(-16 -17.9)">${mark}</g></svg>`;

const jobs = [
  [favicon, 192, 'public/icons/icon-192.png'],
  [favicon, 512, 'public/icons/icon-512.png'],
  [fullBleed, 512, 'public/icons/icon-maskable-512.png'],
  [fullBleed, 180, 'public/icons/apple-touch-icon.png'],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [svg, size, out] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`,
  );
  await page.screenshot({ path: out, omitBackground: true });
  console.log(`wrote ${out}`);
}
await browser.close();
