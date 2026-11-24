import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({
        state: { theme: 'system', quality: 'auto' },
        version: 0,
      }),
    );
    sessionStorage.setItem(
      'effiquest-session',
      JSON.stringify({ state: { enteredApp: true }, version: 0 }),
    );
  });
}

const controls = (page: Page) => page.getByRole('toolbar', { name: 'Simulation controls' });
const results = (page: Page) => page.getByRole('region', { name: 'Measurements' });

test.describe('inclined-plane lab (shared template)', () => {
  test.beforeEach(async ({ page }) => setup(page));

  test('a run at the default set-up gives the physics-plan readings', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await expect(results(page).getByText('Press Start.')).toBeVisible();
    await controls(page).getByRole('button', { name: 'Start' }).click();
    // Steady effort 66.0 N, ramp 2.00 m long and 1.00 m high, η = 74.3 % (plan 3.1).
    const panel = results(page);
    await expect(panel.getByText('Input force (steady)')).toBeVisible();
    await expect(panel).toContainText('66.0');
    await expect(panel).toContainText('2.00');
    await expect(panel).toContainText('1.00');
    await expect(panel).toContainText('74.3');
    await expect(page.getByRole('img', { name: /Input work 132\.08 joules/ })).toBeVisible();
  });

  test('the calculation check accepts answers from the readings', async ({ page }) => {
    await page.goto('/lab/incline');
    await page.getByRole('button', { name: /Calculate/ }).click();
    await page.getByRole('spinbutton', { name: /^Input work/ }).fill('132');
    await page.getByRole('spinbutton', { name: /^Useful \(output\) work/ }).fill('98.1');
    await page.getByRole('spinbutton', { name: /^Your efficiency/ }).fill('74.3');
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.getByText('Your efficiency is correct.')).toBeVisible();
  });

  test('trials are recorded, persist, and a changed set-up is flagged as stale', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await results(page).getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();

    await page.getByRole('slider', { name: /Ramp angle/ }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('You changed the set-up after this run')).toBeVisible();
    await expect(results(page).getByRole('button', { name: 'Record trial' })).toBeDisabled();
    await controls(page).getByRole('button', { name: 'Start new run' }).click();
    await results(page).getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /Results/ }).click();
    await expect(
      page.getByRole('table', { name: 'Your recorded trials' }).getByRole('row'),
    ).toHaveCount(3);
    await expect(page.getByText(/When the ramp angle went from 29° to 30°/)).toBeVisible();
  });

  test('without reduced motion the run animates and can be paused', async ({ page }) => {
    await page.goto('/lab/incline');
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Pulling the block up the ramp at a steady speed…')).toBeVisible();
    await controls(page).getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText(/^Paused\./)).toBeVisible();
    await controls(page).getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByText('Run complete. The block is at the top of the ramp.')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('the frictionless ramp is 100 % efficient', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/incline');
    await page.getByRole('slider', { name: /Friction coefficient/ }).focus();
    await page.keyboard.press('Home');
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(results(page).getByText('100.0').first()).toBeVisible();
  });
});
