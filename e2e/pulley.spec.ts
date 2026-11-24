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

const segments = (page: Page) => page.getByRole('group', { name: 'Supporting rope segments' });
const measurements = (page: Page) => page.getByRole('region', { name: 'Measurements' });
const controls = (page: Page) => page.getByRole('toolbar', { name: 'Simulation controls' });

test.describe('pulley efficiency laboratory (shared template)', () => {
  test.beforeEach(async ({ page }) => setup(page));

  test('the lab picker links to every lab', async ({ page }) => {
    await page.goto('/lab');
    for (const name of ['Lever', 'Inclined plane', 'Pulley system', 'Wheel and axle']) {
      await expect(page.getByRole('link', { name: new RegExp(name) }).first()).toBeVisible();
    }
    await page.getByRole('link', { name: /Pulley system/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Pulley system' })).toBeVisible();
  });

  test('start → pause → resume → finish → replay → reset', async ({ page }) => {
    await page.goto('/lab/pulley');
    await expect(controls(page).getByRole('button', { name: 'Pause' })).toBeDisabled();
    await expect(controls(page).getByRole('button', { name: 'Replay' })).toBeDisabled();

    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Pulling the rope at a steady speed…')).toBeVisible();
    await page.waitForTimeout(800);
    await controls(page).getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText(/^Paused\./)).toBeVisible();
    await expect(page.getByRole('slider', { name: /Load mass/ })).toBeDisabled();

    await controls(page).getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByText('Run complete. The load has risen 1 m.')).toBeVisible({
      timeout: 15_000,
    });
    await controls(page).getByRole('button', { name: 'Replay' }).click();
    await expect(page.getByText('Pulling the rope at a steady speed…')).toBeVisible();
    await expect(page.getByText('Run complete. The load has risen 1 m.')).toBeVisible({
      timeout: 15_000,
    });

    await controls(page).getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByText('Ready. The load is on the floor.')).toBeVisible();
    await expect(measurements(page).getByText('Press Start.')).toBeVisible();
    await expect(page.getByRole('slider', { name: /Load mass/ })).toBeEnabled();
  });

  test('measurements agree with the model: 2 segments, 10 kg', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/pulley');
    await controls(page).getByRole('button', { name: 'Start' }).click();
    const panel = measurements(page);
    await expect(panel.getByText('98.1').first()).toBeVisible();
    // Steady effort, hand check 57.07 N; rope 2.00 m for a 1.00 m lift.
    await expect(panel.getByText('Input force (steady)')).toBeVisible();
    await expect(panel).toContainText('57.1');
    await expect(panel).toContainText('2.00');
    await expect(panel.getByText(/η = .* J ÷ .* J × 100% = \d+\.\d%/)).toBeVisible();
    await expect(
      page.getByRole('img', { name: /lifting the movable pulley block/i }),
    ).toBeVisible();
  });

  test('recording 1 and 4 segments shows the trade-off in the guide', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/pulley');
    await segments(page).getByText('1', { exact: true }).click();
    await expect(page.getByText(/Single fixed pulley: velocity ratio 1/).first()).toBeVisible();
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await measurements(page).getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();

    await segments(page).getByText('4', { exact: true }).click();
    await expect(page.getByText('You changed the set-up after this run')).toBeVisible();
    await controls(page).getByRole('button', { name: 'Start new run' }).click();
    await measurements(page).getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();

    await page.getByRole('button', { name: /Results/ }).click();
    await expect(
      page.getByText(/When the number of supporting segments went from 1 to 4, the effort fell/),
    ).toBeVisible();
    await expect(page.getByText(/moved in opposite directions/)).toBeVisible();
  });

  test('completing the reflection completes the lab', async ({ page }) => {
    await page.goto('/lab/pulley');
    await page.getByRole('button', { name: /Reflect/ }).click();
    const boxes = page.getByRole('textbox');
    for (let i = 0; i < 3; i++) await boxes.nth(i).fill(`Answer ${i + 1}`);
    await page.getByRole('button', { name: 'Save and complete the lab' }).click();
    await expect(page.getByText('Pulley system lab complete')).toBeVisible();
    await page.goto('/lab');
    await expect(page.getByRole('link', { name: /Pulley system/ })).toContainText('Done');
  });

  test('the 3D view has preset camera views', async ({ page }) => {
    await page.goto('/lab/pulley');
    await page.getByRole('tab', { name: '3D view' }).click();
    const canvas = page.locator('canvas');
    const fallback = page.getByRole('heading', { name: '3D is not available on this device' });
    await expect(canvas.or(fallback).first()).toBeVisible({ timeout: 15_000 });
    if (await canvas.isVisible()) {
      const views = page.getByRole('group', { name: 'Camera views' });
      await views.getByRole('button', { name: 'Angled' }).click();
      await expect(views.getByRole('button', { name: 'Angled' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
  });
});
