import { expect, test } from '@playwright/test';

/** The e2e TypeScript config has no DOM service-worker types; this is the part the test uses. */
type SW = { serviceWorker: { ready: Promise<unknown>; controller: unknown } };

/**
 * Offline (D-08, SRC-S6): after one visit online, the whole app works with no network:
 * every route, lazy-loaded screens (lab, 3D view, progress charts) and saving progress.
 */
test('after one online visit, the app works with the network cut', async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem(
      'effiquest-ui',
      JSON.stringify({
        state: { seenWelcome: true, theme: 'system', quality: 'auto' },
        version: 0,
      }),
    );
  });
  await page.goto('/');
  // Wait until the service worker has installed (precache done), then reload so it controls the page.
  await page.evaluate(async () => {
    await (navigator as unknown as SW).serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean((navigator as unknown as SW).serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);

  const pages: Array<[string, RegExp]> = [
    ['/learn/torque', /Torque and rotational motion/],
    ['/quests/turning-forces', /Pushing straight, turning round/],
    ['/assess', /Diagnostics and knowledge checks/],
    ['/progress', /How your thinking has changed/],
    ['/lab/hydraulic-press', /Hydraulic press/],
  ];
  for (const [route, h1] of pages) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
  }

  // A lazy-loaded 3D view still opens offline.
  await page.goto('/lab/incline');
  await page.getByRole('tab', { name: '3D view' }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });

  // Saving progress works offline (IndexedDB on the device).
  await page.goto('/learn/hydraulics');
  await page.getByRole('button', { name: 'Mark module complete' }).click();
  await expect(page.getByText('Module marked complete')).toBeVisible();
});
