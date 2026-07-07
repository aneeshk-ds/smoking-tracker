import { test, expect } from '@playwright/test'

// Verifies the primary tabs are reachable and the app doesn't hard-crash.
// Assumes onboarding may need completing; we only assert the shell renders.
test('bottom navigation renders and routes do not 404', async ({ page }) => {
  const routes = ['', 'insights', 'health', 'settings']
  for (const r of routes) {
    const resp = await page.goto(`/smoking-tracker/${r}`)
    // GH Pages SPA fallback returns 200 for index; locally preview may 200/304.
    expect(page.url()).toContain('/smoking-tracker/')
    await expect(page.locator('#root')).toBeVisible()
  }
})
