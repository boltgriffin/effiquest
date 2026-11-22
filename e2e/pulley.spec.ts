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

const segments = (page: Page) => page.getByRole('group', { name: 'Supporting rope segments' });
const measurements = (page: Page) => page.getByRole('region', { name: 'Measurements' });

test.describe('pulley efficiency laboratory', () => {
  test.beforeEach(async ({ page }) => setup(page));

  test('the lab picker links to both labs', async ({ page }) => {
    await page.goto('/lab');
    await page.getByRole('link', { name: /Pulley system/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Pulley system' })).toBeVisible();
  });

  test('start → pause → resume → finish → replay → reset', async ({ page }) => {
    await page.goto('/lab/pulley');
    const controls = page.getByRole('toolbar', { name: 'Simulation controls' });
    await expect(controls.getByRole('button', { name: 'Pause' })).toBeDisabled();
    await expect(controls.getByRole('button', { name: 'Replay' })).toBeDisabled();

    await controls.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Pulling the rope at a steady speed…')).toBeVisible();
    await page.waitForTimeout(800);
    await controls.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText(/^Paused\./)).toBeVisible();
    // Settings are locked during a run.
    await expect(page.getByRole('slider', { name: /Load mass/ })).toBeDisabled();
    // Live instruments show partial values while paused.
    const ropeText = await measurements(page)
      .getByText(/Rope pulled/)
      .locator('..')
      .locator('..')
      .innerText();
    expect(ropeText).not.toContain('—');

    await controls.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByText('Run complete. The load has risen 1 m.')).toBeVisible({
      timeout: 15_000,
    });
    await expect(measurements(page).getByText('Run complete. Record this trial')).toBeVisible();

    await controls.getByRole('button', { name: 'Replay' }).click();
    await expect(page.getByText('Pulling the rope at a steady speed…')).toBeVisible();
    await expect(page.getByText('Run complete. The load has risen 1 m.')).toBeVisible({
      timeout: 15_000,
    });

    await controls.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByText('Ready. The load is on the floor.')).toBeVisible();
    await expect(measurements(page).getByText('Press Start.')).toBeVisible();
    await expect(page.getByRole('slider', { name: /Load mass/ })).toBeEnabled();
  });

  test('measurements agree with the model: 2 segments, 10 kg', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/pulley');
    await page
      .getByRole('toolbar', { name: 'Simulation controls' })
      .getByRole('button', { name: 'Start' })
      .click();
    const panel = measurements(page);
    await expect(panel.getByText('98.1').first()).toBeVisible();
    // Steady effort for n = 2, 10 kg load, 1 kg block, μb = 0.15 (hand check: 57.07 N).
    await expect(panel.getByText('Input force (steady)')).toBeVisible();
    await expect(panel).toContainText('57.1');
    // Velocity ratio 2, rope pulled 2.00 m for a 1.00 m lift.
    await expect(panel).toContainText('2.00');
    await expect(panel).toContainText('1.00');
    await expect(panel.getByText(/η = .* J ÷ .* J × 100% = \d+\.\d%/)).toBeVisible();
    await expect(
      page.getByRole('img', { name: /lifting the movable pulley block/i }),
    ).toBeVisible();
  });

  test('recording trials with 1 and 4 segments shows the trade-off in the guide', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/pulley');
    const controls = page.getByRole('toolbar', { name: 'Simulation controls' });

    await segments(page).getByText('1', { exact: true }).click();
    await expect(page.getByText(/Single fixed pulley: velocity ratio 1/)).toBeVisible();
    await controls.getByRole('button', { name: 'Start' }).click();
    await measurements(page).getByRole('button', { name: 'Record trial' }).click();
    await expect(page.getByText('Trial recorded on this device')).toBeVisible();

    await segments(page).getByText('4', { exact: true }).click();
    await expect(page.getByText('You changed the set-up after this run')).toBeVisible();
    await expect(measurements(page).getByRole('button', { name: 'Record trial' })).toBeDisabled();
    await controls.getByRole('button', { name: 'Start new run' }).click();
    await measurements(page).getByRole('button', { name: 'Record trial' }).click();

    await page.getByRole('button', { name: /Results/ }).click();
    await expect(page.getByText(/From 1 to 4 supporting segments, the effort fell/)).toBeVisible();
    await expect(
      page.getByText('More mechanical advantage did not mean less wasted energy.'),
    ).toBeVisible();
  });

  test('completing the reflection completes the lab', async ({ page }) => {
    await page.goto('/lab/pulley');
    await page.getByRole('button', { name: /Reflect/ }).click();
    const boxes = page.getByRole('textbox');
    for (let i = 0; i < 3; i++) await boxes.nth(i).fill(`Answer ${i + 1}`);
    await page.getByRole('button', { name: 'Save and complete the lab' }).click();
    await expect(page.getByText('Pulley lab complete')).toBeVisible();
    await page.goto('/lab');
    await expect(page.getByRole('link', { name: /Pulley system/ })).toContainText('Done');
  });
});
