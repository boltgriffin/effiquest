import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page) {
  // The one-time "ready to work offline" notice can cover buttons on a phone; dismiss it.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Dismiss' }), async (b) => {
    await b.click();
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({
        state: { seenWelcome: true, theme: 'system', quality: 'auto' },
        version: 0,
      }),
    );
    localStorage.setItem(
      'effiquest-learner',
      JSON.stringify({ state: { learnerCode: 'G11A-09', teacherMode: false }, version: 0 }),
    );
  });
}

test('baseline diagnostic: answers survive a refresh, no feedback until submitted, results by idea', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/assess');
  await page.getByRole('link', { name: /Start.*Baseline diagnostic/ }).click();
  await expect(page.getByRole('heading', { name: 'Question 1 of 13' })).toBeVisible();

  // Q1 right (torque), Q2 right (10 N·m), then refresh.
  await page.getByLabel(/A net torque/).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel(/Your answer/).fill('10');
  await expect(page.getByRole('button', { name: /Check/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Question 3 of 13' })).toBeVisible();
  await page.waitForTimeout(500); // let the draft save (300 ms debounce)
  await page.reload();
  await expect(page.getByText('earlier answers were kept')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Question 3 of 13' })).toBeVisible();
  await expect(page.getByText('2 of 13 answered')).toBeVisible();

  // The Assess page offers to continue.
  await page.goto('/assess');
  await page.getByRole('link', { name: /Continue.*Baseline diagnostic/ }).click();
  await expect(page.getByRole('heading', { name: 'Question 3 of 13' })).toBeVisible();

  // Jump to the review and submit the rest unanswered.
  for (let i = 3; i <= 13; i++) {
    await page.getByRole('button', { name: /^(Next|Review answers)$/ }).click();
  }
  await expect(page.getByText('11 without an answer')).toBeVisible();
  await page.getByRole('button', { name: 'Submit answers' }).click();

  const status = page.getByRole('status').filter({ hasText: '/ 15' });
  await expect(status).toContainText('2 / 15');
  await expect(page.getByText('Why the answers are not shown')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Areas to improve', exact: true })).toBeVisible();

  // Refresh: still submitted, cannot be retaken.
  await page.reload();
  await expect(page.getByText('Strengths and areas to improve')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);

  // Progress shows the baseline per idea and the attempt.
  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: 'Baseline', exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: /G1 · Translational/ })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  await expect(page.getByRole('link', { name: 'Baseline diagnostic' })).toBeVisible();

  // The post diagnostic is now open.
  await page.goto('/assess');
  await expect(page.getByRole('link', { name: /Start.*Post diagnostic/ })).toBeVisible();
});

test('knowledge check: a matching question gives partial credit and can be retaken', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/quests/turning-forces/check');
  await page.getByLabel(/Your answer/).fill('15');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Force').selectOption('torque');
  await page.getByLabel('Mass').selectOption('inertia');
  await page.getByLabel('Acceleration').selectOption('angle');
  await page.getByLabel('Distance moved').selectOption('alpha');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Some matches are not right yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByText(/Correct match: Angular acceleration/)).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(/lever arm is short/).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();
  // Torque 1 + matching 0 (it needed a second check) + 1 = 2 of 6.
  await expect(page.getByRole('status').filter({ hasText: '/ 6' })).toContainText('2 / 6');
  await expect(page.getByText('Correct answer:', { exact: false }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Question 1 of 3' })).toBeVisible();
  await expect(page.getByLabel(/Your answer/)).toHaveValue('');
});
