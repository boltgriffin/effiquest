import { expect, test, type Page } from '@playwright/test';

/** The nine labs in showcase order, with their existing routes (content/quests.ts labs). */
const LABS = [
  { title: 'Lever', path: '/lab/lever' },
  { title: 'Inclined plane', path: '/lab/incline' },
  { title: 'Pulley system', path: '/lab/pulley' },
  { title: 'Wheel and axle', path: '/lab/wheel-and-axle' },
  { title: 'Hydraulic press', path: '/lab/hydraulic-press' },
  { title: 'Screw jack', path: '/lab/screw' },
  { title: 'Wedge', path: '/lab/wedge' },
  { title: 'Bicycle (compound)', path: '/lab/bicycle' },
  { title: 'Hydraulic brake (compound)', path: '/lab/hydraulic-brake' },
] as const;

// One test at a time (see playwright.config.ts: software 3D is heavy).
test.describe.configure({ mode: 'default' });

const short = (t: string) => t.replace(/ \(compound\)$/, '');
const strip = (page: Page) => page.getByRole('group', { name: 'Choose a simulation' });
const info = (page: Page) => page.locator('#simulation-info');
const stage = (page: Page) => page.locator('.showcase-stage');

async function expectSelected(page: Page, index: number) {
  const lab = LABS[index]!;
  await expect(info(page).getByRole('heading', { level: 3 })).toHaveText(short(lab.title));
  await expect(
    strip(page).getByRole('button', { name: short(lab.title), exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(stage(page)).toHaveAttribute('aria-label', new RegExp(`^${index + 1} of 9: `));
}

// The test browsers draw 3D on the CPU (no GPU) and run in parallel, so most tests use reduced
// motion: the showcase is then a still picture that redraws only when the selection changes.
// One test below keeps the full animation running.
test.describe('welcome screen: 3D simulation showcase', () => {
  test.use({ reducedMotion: 'reduce' });
  test.beforeEach(async ({ page }) => {
    // Software 3D (no GPU) in parallel browsers: allow three times the usual time.
    test.slow();
    await page.goto('/welcome');
    await page.locator('#simulations').scrollIntoViewIfNeeded();
  });

  test('hero, navigation and the real 3D canvas load without errors', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' || /WebGL context|Context Lost/.test(m.text())) {
        problems.push(m.text());
      }
    });
    await expect(
      page.getByRole('heading', { level: 1, name: 'Explore. Experiment. Understand.' }),
    ).toBeVisible();
    await expect(stage(page).locator('canvas')).toBeVisible();
    await expectSelected(page, 0);
    // No sideways scrolling on any screen size.
    const overflow = await page.evaluate<number>(
      'document.documentElement.scrollWidth - window.innerWidth',
    );
    expect(overflow).toBeLessThanOrEqual(0);
    // Browse through all nine (each builds its model), then check nothing went wrong.
    for (let i = 1; i < LABS.length; i += 1) {
      await page.getByRole('button', { name: /^Next simulation/ }).click();
      await expectSelected(page, i);
    }
    await page.waitForTimeout(500);
    expect(problems).toEqual([]);
  });

  test('every selector shows its lab; arrows loop from the ninth to the first', async ({
    page,
  }) => {
    for (let i = 0; i < LABS.length; i += 1) {
      await strip(page)
        .getByRole('button', { name: short(LABS[i]!.title), exact: true })
        .click();
      await expectSelected(page, i);
    }
    await page.getByRole('button', { name: /^Next simulation: Lever/ }).click();
    await expectSelected(page, 0);
    await page.getByRole('button', { name: /^Previous simulation: Hydraulic brake/ }).click();
    await expectSelected(page, 8);
  });

  test('arrow keys, Home and End choose simulations', async ({ page }) => {
    await stage(page).focus();
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, 1);
    await page.keyboard.press('End');
    await expectSelected(page, 8);
    await page.keyboard.press('ArrowRight');
    await expectSelected(page, 0);
    await page.keyboard.press('ArrowLeft');
    await expectSelected(page, 8);
    await page.keyboard.press('Home');
    await expectSelected(page, 0);
  });

  test('a horizontal swipe on the stage changes the simulation', async ({ page }) => {
    const box = await stage(page).boundingBox();
    if (!box) throw new Error('no stage');
    const y = box.y + box.height * 0.3;
    const swipe = async (from: number, to: number) => {
      await page.mouse.move(box.x + box.width * from, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * to, y, { steps: 6 });
      await page.mouse.up();
    };
    await swipe(0.7, 0.3); // swipe left: next
    await expectSelected(page, 1);
    await swipe(0.3, 0.7); // swipe right: previous
    await expectSelected(page, 0);
  });

  for (const [i, lab] of LABS.entries()) {
    test(`Explore opens the existing ${short(lab.title)} lab`, async ({ page }) => {
      await strip(page)
        .getByRole('button', { name: short(lab.title), exact: true })
        .click();
      await expectSelected(page, i);
      await info(page).getByRole('button', { name: 'Explore simulation' }).click();
      await expect(page).toHaveURL(new RegExp(`${lab.path}$`));
      // The lab page code loads lazily; allow for a busy test machine.
      await expect(page.getByRole('heading', { level: 1, name: lab.title })).toBeVisible({
        timeout: 20_000,
      });
    });
  }

  test('exploring a lab lets the dashboard open for the rest of the visit', async ({ page }) => {
    await info(page).getByRole('button', { name: 'Explore simulation' }).click();
    await expect(page).toHaveURL(/\/lab\/lever$/);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Your laboratory' })).toBeVisible();
  });
});

test.describe('with animation (no reduced motion)', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('the showcase animates and still responds to the arrows', async ({ page }) => {
    test.slow();
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(m.text());
    });
    await page.goto('/welcome');
    await page.locator('#simulations').scrollIntoViewIfNeeded();
    await expect(stage(page).locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: /^Next simulation/ }).click();
    await expectSelected(page, 1);
    await page.getByRole('button', { name: /^Previous simulation/ }).click();
    await expectSelected(page, 0);
    expect(problems).toEqual([]);
  });
});

test('without WebGL the showcase shows each lab diagram instead', async ({ page }) => {
  // Simulate a device with no WebGL.
  await page.addInitScript({
    content: `
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/.test(type) ? null : original.call(this, type, ...rest);
      };`,
  });
  await page.goto('/welcome');
  await expect(
    page.getByText('This device cannot show 3D, so the lab diagram is shown.'),
  ).toBeVisible();
  await expect(stage(page).locator('canvas')).toHaveCount(0);
  await expect(stage(page).locator('svg').first()).toBeVisible();
  await page.getByRole('button', { name: /^Next simulation/ }).click();
  await expectSelected(page, 1);
});

// D-26: every visit opened at the home address starts on the welcome screen.
test.describe('the welcome screen opens every visit', () => {
  test.use({ reducedMotion: 'reduce' });
  test.beforeEach(() => test.slow());

  test('new visit: welcome; after entering, a reload keeps the dashboard; a new tab starts again', async ({
    page,
    context,
  }) => {
    // A returning learner: preferences already saved on this device.
    await context.addInitScript({
      content: `localStorage.setItem('effiquest-ui', JSON.stringify({ state: { theme: 'system', quality: 'auto' }, version: 0 }));`,
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome$/);
    await page.getByRole('button', { name: /^Enter( the lab)?$/ }).click();
    await expect(page.getByRole('heading', { name: 'Your laboratory' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your laboratory' })).toBeVisible();

    const second = await context.newPage();
    await second.goto('/');
    await expect(second).toHaveURL(/\/welcome$/);
    await expect(
      second.getByRole('heading', { level: 1, name: 'Explore. Experiment. Understand.' }),
    ).toBeVisible();
  });

  test('a direct link to a page opens that page, not the welcome', async ({ page }) => {
    await page.goto('/lab/wedge');
    await expect(page.getByRole('heading', { level: 1, name: 'Wedge' })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Your laboratory' })).toBeVisible();
  });
});
