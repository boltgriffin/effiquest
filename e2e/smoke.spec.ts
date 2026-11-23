import { expect, test, type Page } from '@playwright/test';

/** Skip the first-visit welcome redirect for tests that start inside the app. */
async function asReturningUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({
        state: { seenWelcome: true, theme: 'system', quality: 'auto' },
        version: 0,
      }),
    );
  });
}

const main = (page: Page) => page.getByRole('navigation', { name: 'Main' });

/** Uses the visible main navigation, falling back to the phone menu for items not on the tab bar. */
async function navigate(page: Page, label: string) {
  const link = main(page).getByRole('link', { name: label, exact: true });
  if (await link.isVisible()) {
    await link.click();
    return;
  }
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: label }).click();
    return;
  }
  // Desktop: utility links (Settings) sit in the sidebar footer, outside the main nav.
  await page.locator('aside').getByRole('link', { name: label, exact: true }).click();
}

test('first visit shows the welcome screen, and entering leads to the dashboard', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole('heading', { name: 'Find out where the energy goes.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Enter the laboratory' }).click();
  await expect(page.getByRole('heading', { name: 'Your laboratory' })).toBeVisible();
});

test.describe('inside the app', () => {
  test.beforeEach(async ({ page }) => asReturningUser(page));

  test('main navigation reaches every section', async ({ page }) => {
    await page.goto('/');
    const pages: Array<[string, string]> = [
      ['Learn', 'Modules'],
      ['Lab', 'Laboratory'],
      ['Quests', 'Ideas to test'],
      ['Assess', 'Diagnostics'],
      ['Progress', 'How your thinking has changed'],
      ['Settings', 'Settings'],
    ];
    for (const [link, heading] of pages) {
      await navigate(page, link);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    }
  });

  test('module page tabs switch content', async ({ page }) => {
    await page.goto('/learn/advantage-efficiency');
    await page.getByRole('tab', { name: 'Key equations' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Efficiency');
  });

  test('lab: slider changes the diagram', async ({ page }) => {
    await page.goto('/lab/incline');
    const angle = page.getByRole('slider', { name: /Ramp angle/ });
    await angle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('svg[role="img"] desc')).toContainText('31 degrees');
  });

  test('lab: assumptions dialog opens and closes with Escape', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: 'Model assumptions' }).click();
    const dialog = page.getByRole('dialog', { name: 'Model assumptions' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('lab: completing the reflection completes the lab', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Reflect/ }).click();
    const boxes = page.getByRole('textbox');
    for (let i = 0; i < 3; i++) await boxes.nth(i).fill(`Answer ${i + 1}`);
    await page.getByRole('button', { name: 'Save and complete the lab' }).click();
    await expect(page.getByText('Inclined plane lab complete')).toBeVisible();
  });

  test('assess page lists the diagnostics and knowledge checks, post locked', async ({ page }) => {
    await page.goto('/assess');
    await expect(page.getByText('Draft questions')).toBeVisible();
    await expect(page.getByRole('link', { name: /Start.*Baseline diagnostic/ })).toBeVisible();
    await expect(page.getByText('After the baseline')).toBeVisible();
    await page.goto('/assess/post');
    await expect(page.getByText('Take the baseline diagnostic first')).toBeVisible();
  });

  test('progress shows an empty state, then a chart and table with sample data', async ({
    page,
  }) => {
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'No diagnostic results yet' })).toBeVisible();
    await page.getByRole('switch', { name: 'Preview with sample data' }).click();
    await page.getByRole('tab', { name: 'Table' }).click();
    await expect(page.getByRole('table')).toContainText('Mechanical advantage vs efficiency');
  });

  test('theme choice is applied to the document', async ({ page }) => {
    await page.goto('/settings');
    await page.getByText('Dark', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByText('Light', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('design reference page renders', async ({ page }) => {
    await page.goto('/design');
    await expect(page.getByRole('heading', { level: 1, name: 'Design system' })).toBeVisible();
  });

  test('unknown route shows the not-found state', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('3D tab loads the canvas or the no-WebGL fallback', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('tab', { name: '3D view' }).click();
    const canvas = page.locator('canvas');
    const fallback = page.getByRole('heading', { name: '3D is not available on this device' });
    await expect(canvas.or(fallback).first()).toBeVisible({ timeout: 15_000 });
  });
});

test('web app manifest is served', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  expect((await res.json()).short_name).toBe('EffiQuest 3D');
});
