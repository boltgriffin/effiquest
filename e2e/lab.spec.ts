import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page) {
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

const results = (page: Page) => page.getByRole('region', { name: 'Measurements' });

test.describe('inclined-plane lab with real physics', () => {
  test.beforeEach(async ({ page }) => setup(page));

  test('a run at the default set-up gives the physics-plan readings', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await expect(page.getByRole('heading', { name: 'No measurements yet' })).toBeVisible();
    await page.getByRole('button', { name: /Measure/ }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // Spring scale 66.0 N, ramp 2 m long and 1 m high, η = 74.3 % (docs/PHYSICS_MODEL_PLAN.md 3.1).
    await expect(page.getByText('Scale: 66.0 N · pulled 2.00 m · rose 1.00 m')).toBeVisible();
    const panel = results(page);
    await expect(panel.getByText('74.3')).toBeVisible();
    await expect(panel.getByText('132.08').first()).toBeVisible();
    await expect(page.getByRole('img', { name: /Input work 132\.08 joules/ })).toBeVisible();
  });

  test('the learner calculation check accepts answers from the readings', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Calculate/ }).click();
    // Readings: 66.0 N over 2.00 m; 98.1 N over 1.00 m.
    await page.getByRole('spinbutton', { name: /^Input work/ }).fill('132');
    await page.getByRole('spinbutton', { name: /^Useful \(output\) work/ }).fill('98.1');
    await page.getByRole('spinbutton', { name: /^Your efficiency/ }).fill('74.3');
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.getByText('Your efficiency is correct.')).toBeVisible();
  });

  test('trials are recorded, listed, and a changed set-up is flagged as stale', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Measure/ }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await page.getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trial recorded' })).toBeDisabled();
    const table = page.getByRole('table', { name: 'Recorded trials' });
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('74.3');

    // Change the angle: results belong to the old set-up now.
    await page.getByRole('button', { name: /Set up/ }).click();
    await page.getByRole('slider', { name: /Ramp angle/ }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('You changed the set-up after this run')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record trial' })).toBeDisabled();

    // A gentler ramp: more mechanical advantage, lower efficiency.
    await page.getByRole('button', { name: /Measure/ }).click();
    await page.getByRole('button', { name: 'Run again' }).click();
    await page.getByRole('button', { name: 'Record trial' }).click();
    await expect(table.getByRole('row')).toHaveCount(3);

    // Trials persist after a reload.
    await page.reload();
    await expect(page.getByRole('table', { name: 'Recorded trials' }).getByRole('row')).toHaveCount(
      3,
    );
  });

  test('without reduced motion the run animates and then finishes', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Measure/ }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Running…' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Run again' })).toBeEnabled({ timeout: 10_000 });
    await expect(page.getByText(/Scale: 66\.0 N/)).toBeVisible();
  });

  test('the frictionless ramp is 100 % efficient', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Set up/ }).click();
    const mu = page.getByRole('slider', { name: /Friction coefficient/ });
    await mu.focus();
    await page.keyboard.press('Home');
    await page.getByRole('button', { name: /Measure/ }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(results(page).getByText('100.0')).toBeVisible();
  });
});
