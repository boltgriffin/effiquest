import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page) {
  await page.addLocatorHandler(page.getByRole('button', { name: 'Dismiss' }), async (b) => {
    await b.click();
  });
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

test('a module lesson: draft label, contents, worked example, practice question, lab link', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/learn/torque');
  await expect(page.getByText('Draft · teacher review')).toBeVisible();
  const contents = page.getByRole('navigation', { name: 'In this lesson' });
  await contents.getByRole('link', { name: "Newton's second law for turning" }).click();
  await expect(
    page.getByRole('heading', { name: "Newton's second law for turning" }),
  ).toBeInViewport();

  await expect(page.getByRole('heading', { name: 'Pushing a door' })).toBeVisible();
  await expect(page.getByText('Answer: 32 N·m')).toBeVisible();

  // Practice question: wrong, then the answer is revealed after the second try.
  const question = page
    .locator('div')
    .filter({ has: page.getByRole('group', { name: /A 25 N force/ }) })
    .last();
  await question.getByLabel(/Your answer/).fill('12');
  await question.getByRole('button', { name: 'Check answer' }).click();
  await expect(question.getByText('Not quite')).toBeVisible();
  await question.getByRole('button', { name: 'Check again' }).click();
  await expect(question.getByText('Not correct')).toBeVisible();

  await page.getByRole('link', { name: /Try it in the lab: Lever/ }).click();
  await expect(page).toHaveURL(/\/lab\/lever$/);
});

test('the D-13 bicycle section shows the teacher-check note', async ({ page }) => {
  await setup(page);
  await page.goto('/learn/efficiency-practice');
  await expect(page.getByText('Awaiting teacher check')).toBeVisible();
  await expect(page.getByText(/D-13/).first()).toBeVisible();
});

test('the hydraulic press is listed on the lab page and in the pressure quest', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/lab');
  await expect(page.getByRole('link', { name: /Hydraulic press/ }).first()).toBeVisible();
  await page.goto('/quests/pressure-at-work');
  await page.getByRole('link', { name: /Open.*Lift a load with a hydraulic press/ }).click();
  await expect(page).toHaveURL(/\/lab\/hydraulic-press$/);
});
