import { test, expect } from "@playwright/test";

test("loads and scores over time", async ({ page }) => {
  await page.goto("/?test=1&seed=1337");
  await page.waitForFunction(() => window.__TEST__?.ready === true);

  const initial = await page.evaluate(() => window.__TEST__.getState());
  expect(initial.asteroids).toBe(3);
  expect(initial.stationsAlive).toBeGreaterThan(0);
  expect(initial.score).toBe(0);

  await page.evaluate(() => window.__TEST__.advanceTime(2000));
  const afterScore = await page.evaluate(() => window.__TEST__.getState());
  expect(afterScore.score).toBeGreaterThan(0);
  expect(afterScore.score).toBeGreaterThanOrEqual(initial.stationsAlive * 2);
});

test("game over when stations destroyed", async ({ page }) => {
  await page.goto("/?test=1&seed=1337");
  await page.waitForFunction(() => window.__TEST__?.ready === true);

  await page.evaluate(() => window.__TEST__.destroyStations());
  const state = await page.evaluate(() => window.__TEST__.getState());
  expect(state.gameOver).toBe(true);
  expect(state.stationsAlive).toBe(0);
});
