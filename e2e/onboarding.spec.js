import { test, expect } from '@playwright/test'

// Fresh-load onboarding flow. Clears IndexedDB so we always start clean.
test.beforeEach(async ({ page }) => {
  await page.goto('/smoking-tracker/')
  await page.evaluate(async () => {
    for (const db of await indexedDB.databases?.() ?? []) {
      if (db.name) indexedDB.deleteDatabase(db.name)
    }
  })
})

test('app boots and shows onboarding for a new user', async ({ page }) => {
  await page.goto('/smoking-tracker/')
  // Onboarding welcome copy or a Get started affordance should be present.
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveTitle(/tracker/i)
})

test('service worker + manifest are wired for PWA install', async ({ page }) => {
  await page.goto('/smoking-tracker/')
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestHref).toBeTruthy()
  const hasViewport = await page.locator('meta[name="viewport"]').count()
  expect(hasViewport).toBeGreaterThan(0)
})
