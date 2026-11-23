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

const controls = (page: Page) => page.getByRole('toolbar', { name: 'Simulation controls' });
const results = (page: Page) => page.getByRole('region', { name: 'Measurements' });

test.describe('lever and wheel-and-axle labs, comparison', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('lever: default run (10 kg, arms 0.80 / 0.20 m, μp 0.20)', async ({ page }) => {
    await page.goto('/lab/lever');
    await expect(page.getByRole('heading', { level: 1, name: 'Lever' })).toBeVisible();
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Run complete. The beam has turned 20°.')).toBeVisible();
    const panel = results(page);
    // Hand check: F = 98.1 × (0.20 + 0.002) ÷ (0.80 − 0.002) = 24.83 N; IMA 4.00.
    await expect(panel).toContainText('24.8');
    await expect(panel).toContainText('4.00');
    // Arc distances to the millimetre: 0.279 m and 0.070 m.
    await expect(panel).toContainText('0.279');
    await expect(panel).toContainText('0.070');
    await expect(page.getByRole('img', { name: /friction in the pivot/i })).toBeVisible();
  });

  test('lever: a longer load arm gives mechanical advantage below 1', async ({ page }) => {
    await page.goto('/lab/lever');
    const effort = page.getByRole('slider', { name: /Effort arm/ });
    await effort.focus();
    await page.keyboard.press('Home'); // 0.20 m
    const load = page.getByRole('slider', { name: /Load arm/ });
    await load.focus();
    await page.keyboard.press('End'); // 1.00 m
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(results(page)).toContainText('0.20'); // IMA = 0.20 / 1.00
  });

  test('wheel and axle: default run (R 0.30 m, r 0.05 m)', async ({ page }) => {
    await page.goto('/lab/wheel-and-axle');
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Run complete. The load has risen 0.5 m.')).toBeVisible();
    const panel = results(page);
    // Hand check: F = (98.1 × 0.0515 + 0.0015 × 19.62) ÷ 0.2985 = 17.02 N; IMA 6; rope 3.00 m.
    await expect(panel).toContainText('17.0');
    await expect(panel).toContainText('6.00');
    await expect(panel).toContainText('3.00');
    await expect(page.getByRole('img', { name: /friction in the axle bearing/i })).toBeVisible();
  });

  test('wheel and axle: an axle as big as the wheel is rejected', async ({ page }) => {
    await page.goto('/lab/wheel-and-axle');
    const wheel = page.getByRole('slider', { name: /Wheel radius/ });
    await wheel.focus();
    await page.keyboard.press('Home'); // 0.10 m
    const axle = page.getByRole('slider', { name: /Axle radius/ });
    await axle.focus();
    await page.keyboard.press('End'); // 0.10 m
    await controls(page).getByRole('button', { name: 'Start' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'The axle must be smaller than the wheel.' }),
    ).toBeVisible();
  });

  test('knowledge check gives immediate feedback', async ({ page }) => {
    await page.goto('/lab/lever');
    await page.getByRole('button', { name: /Check/ }).click();
    await page.getByLabel('30 N').check();
    await expect(page.getByText('Not quite.')).toBeVisible();
    await page.getByLabel('100 N').check();
    await expect(page.getByText(/Correct\./)).toBeVisible();
    await expect(page.getByText('1 of 3 correct')).toBeVisible();
  });

  test('comparison page shows the learner’s trials across machines', async ({ page }) => {
    await page.goto('/lab/compare');
    await expect(page.getByRole('heading', { name: 'No trials recorded yet' })).toBeVisible();

    for (const path of ['/lab/lever', '/lab/pulley']) {
      await page.goto(path);
      await controls(page).getByRole('button', { name: 'Start' }).click();
      await results(page).getByRole('button', { name: 'Record trial' }).click();
      await expect(page.getByText('Trial recorded on this device')).toBeVisible();
    }
    await page.goto('/lab');
    await page.getByRole('link', { name: 'Compare machines' }).click();
    const table = page.getByRole('table', { name: 'Latest valid trial for each machine' });
    await expect(table).toContainText('Lever');
    await expect(table).toContainText('No trial recorded');
    await expect(page.getByText(/What your data show/)).toBeVisible();
  });

  test('unknown machine shows not found', async ({ page }) => {
    await page.goto('/lab/screw');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('hydraulic press lab', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'effiquest-ui',
        JSON.stringify({
          state: { seenWelcome: true, theme: 'system', quality: 'auto' },
          version: 0,
        }),
      );
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('default run: Pascal readouts, both losses, IMA = area ratio', async ({ page }) => {
    await page.goto('/lab/hydraulic-press');
    await expect(page.getByRole('heading', { level: 1, name: 'Hydraulic press' })).toBeVisible();
    await page
      .getByRole('toolbar', { name: 'Simulation controls' })
      .getByRole('button', { name: 'Start' })
      .click();
    await expect(page.getByText('Run complete. The load has risen 0.1 m.')).toBeVisible();
    const panel = page.getByRole('region', { name: 'Measurements' });
    // Hand check: P = 986 N ÷ 0.005027 m² = 196.2 kPa; F_in = P × A₁ + 5 N = 66.6 N; IMA = 16.
    await expect(panel).toContainText('196.2');
    await expect(panel).toContainText('66.6');
    await expect(panel).toContainText('16.00');
    await expect(panel.getByText('Output force from your effort (ideal)')).toBeVisible();
    await expect(
      page.getByRole('img', {
        name: /friction at the piston seals.*fluid leaking past the seals/i,
      }),
    ).toBeVisible();
  });

  test('no seals friction and no leakage gives 100 %', async ({ page }) => {
    await page.goto('/lab/hydraulic-press');
    for (const name of [/Seal friction/, /Leakage/]) {
      await page.getByRole('slider', { name }).focus();
      await page.keyboard.press('Home');
    }
    await page
      .getByRole('toolbar', { name: 'Simulation controls' })
      .getByRole('button', { name: 'Start' })
      .click();
    await expect(
      page.getByRole('region', { name: 'Measurements' }).getByText('100.0').first(),
    ).toBeVisible();
  });

  test('the pressure quest now includes the hydraulic lab', async ({ page }) => {
    await page.goto('/quests/pressure-at-work');
    await expect(page.getByText('Lift a load with a hydraulic press').first()).toBeVisible();
  });
});
