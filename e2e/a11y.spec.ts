import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Automated accessibility audit (WCAG 2.1 A/AA rules, axe-core) of every main page, in both themes. */
const routes = [
  '/',
  '/welcome',
  '/learn',
  '/learn/advantage-efficiency',
  '/lab',
  '/lab/incline',
  '/lab/hydraulic-press',
  '/lab/screw',
  '/lab/wedge',
  '/lab/bicycle',
  '/lab/hydraulic-brake',
  '/lab/compare',
  '/quests',
  '/quests/effort-vs-efficiency',
  '/quests/turning-forces/check',
  '/assess',
  '/assess/baseline',
  '/progress',
  '/settings',
  '/teacher',
];

async function setup(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({ state: { seenWelcome: true, theme: t, quality: 'auto' }, version: 0 }),
    );
    localStorage.setItem(
      'effiquest-learner',
      JSON.stringify({ state: { learnerCode: 'A11Y-01', teacherMode: true }, version: 0 }),
    );
  }, theme);
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${theme} theme`, () => {
    for (const route of routes) {
      test(`${route}`, async ({ page }) => {
        await setup(page, theme);
        await page.goto(route);
        await page.locator('h1').first().waitFor();
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          // The WebGL canvas itself cannot be inspected; its labels and controls around it are.
          .exclude('canvas')
          .analyze();
        const found = results.violations.map(
          (v) =>
            `${v.impact ?? ''} ${v.id}: ${v.help} @ ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(' '))
              .join(' | ')}`,
        );
        expect(found).toEqual([]);
      });
    }
  });
}
