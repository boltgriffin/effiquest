import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, opts: { learnerCode?: string; teacherMode?: boolean } = {}) {
  await page.addInitScript((o) => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({
        state: { seenWelcome: true, theme: 'system', quality: 'auto' },
        version: 0,
      }),
    );
    localStorage.setItem(
      'effiquest-learner',
      JSON.stringify({
        state: { learnerCode: o.learnerCode ?? null, teacherMode: o.teacherMode ?? false },
        version: 0,
      }),
    );
  }, opts);
}

test('active navigation state follows the current section', async ({ page }) => {
  await setup(page);
  await page.goto('/quests/perfect-machine');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Quests' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: /Home|Dashboard/ })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('breadcrumbs lead back to the section', async ({ page }) => {
  await setup(page);
  await page.goto('/learn/torque');
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Learn' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Modules' })).toBeVisible();
});

test('the phone menu opens, lists every destination and closes after navigating', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'phone layout only');
  await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu.getByRole('link', { name: 'Assess' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Settings' })).toBeVisible();
  await menu.getByRole('link', { name: 'Assess' }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: 'Diagnostics' })).toBeVisible();
});

test('a learner completes a full quest and sees it everywhere', async ({ page }) => {
  await setup(page, { learnerCode: 'G11A-07' });
  await page.goto('/');
  await expect(page.locator('#main').getByText('Learner G11A-07')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nothing yet' })).toBeVisible();

  // Stage 1: the dashboard's next step is the lesson.
  await page.getByRole('link', { name: 'Mechanical advantage and efficiency' }).first().click();
  await page.getByRole('button', { name: 'Mark module complete' }).click();
  await expect(page.getByText('Module marked complete')).toBeVisible();

  // Stage 2: lab explanation completes the lab activity.
  await page.goto('/lab/incline');
  await page.getByRole('button', { name: /Reflect/ }).click();
  const boxes = page.getByRole('textbox');
  for (let i = 0; i < 3; i++) await boxes.nth(i).fill(`Reflection ${i + 1}`);
  await page.getByRole('button', { name: 'Save and complete the lab' }).click();
  await expect(page.getByText('Inclined plane lab complete')).toBeVisible();

  // Stage 3: answer the quest question.
  await page.goto('/quests/effort-vs-efficiency');
  await expect(page.getByText('2 of 3 stages done')).toBeVisible();
  await page.getByLabel('My evidence contradicts this idea').check();
  await page.getByLabel(/What evidence/).fill('Less effort did not mean less wasted energy.');
  await page.getByRole('button', { name: 'Submit answer' }).click();
  await expect(page.getByText('Quest complete')).toBeVisible();
  await expect(page.getByRole('link', { name: /Next quest/ })).toBeVisible();

  // Dashboard reflects it.
  await page.goto('/');
  await expect(page.getByText('Quests 1 of 4')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Answered quest question: Less effort, more efficient?' }),
  ).toBeVisible();
});

test('the reflection stays locked until the earlier stages are done', async ({ page }) => {
  await setup(page);
  await page.goto('/quests/turning-forces#reflect');
  await expect(page.getByText('Finish the earlier stages first')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit answer' })).toHaveCount(0);
});

test('a learner sets a code and downloads a results file', async ({ page }) => {
  await setup(page);
  await page.goto('/settings#learner');
  await expect(page.getByRole('button', { name: 'Download my results' })).toBeDisabled();
  await page.getByLabel('Learner code').fill('bad code!');
  await page.getByRole('button', { name: 'Save code' }).click();
  await expect(page.getByRole('alert')).toContainText('3 to 16 letters');
  await page.getByLabel('Learner code').fill('g11a-03');
  await page.getByRole('button', { name: 'Save code' }).click();
  await expect(page.getByText('Learner code G11A-03 saved.')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my results' }).click();
  expect((await download).suggestedFilename()).toBe('effiquest-results-G11A-03.json');
});

test('teacher tools are hidden and show an unauthorized state until enabled', async ({ page }) => {
  await setup(page);
  await page.goto('/teacher');
  await expect(
    page.getByRole('heading', { name: 'Teacher tools are off on this device' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Turn them on in Settings' }).click();
  await page.getByRole('switch', { name: 'Show teacher tools on this device' }).click();
  await page.getByRole('link', { name: 'Open class overview' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Class overview' })).toBeVisible();
});

test('teacher imports learner files, sees the class and downloads the CSV', async ({ page }) => {
  await setup(page, { teacherMode: true });
  await page.goto('/teacher');
  await expect(page.getByRole('heading', { name: 'No learner results yet' })).toBeVisible();

  const file = {
    format: 'effiquest-learner-results',
    version: 1,
    exportedAt: '2026-11-25T08:00:00.000Z',
    learnerCode: 'G11A-01',
    progressEvents: [
      {
        id: 'a',
        ownerId: 'G11A-01',
        kind: 'lesson_completed',
        refId: 'torque',
        createdAt: '2026-11-25T07:00:00.000Z',
      },
    ],
    diagnostics: { baseline: { G1: 40 } },
  };
  await page.getByLabel('Import results files').setInputFiles([
    {
      name: 'g11a-01.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(file)),
    },
    { name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') },
  ]);
  await expect(page.getByText('Imported learner G11A-01.')).toBeVisible();
  await expect(page.getByText('This file is not an EffiQuest results file.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Progress for each learner' })).toContainText(
    'G11A-01',
  );
  await expect(
    page.getByRole('table', { name: 'Average diagnostic score per misconception' }),
  ).toContainText('40%');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download class CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/^effiquest-class-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('teacher sample class preview is labeled and cannot be exported', async ({ page }) => {
  await setup(page, { teacherMode: true });
  await page.goto('/teacher');
  await page.getByRole('switch', { name: 'Preview with a sample class' }).click();
  await expect(page.getByText('Sample class', { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Progress for each learner' })).toContainText(
    'G11A-04',
  );
  await expect(page.getByRole('button', { name: 'Download class CSV' })).toBeDisabled();
});
