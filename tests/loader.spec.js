import { test, expect } from '@playwright/test'

test('home loading animation masks initialization and then releases interaction', async ({ page }) => {
  await page.goto('/')
  const loader = page.locator('.site-loader')
  await expect(loader).toBeVisible()
  await expect(loader.getByText('OPENING WORKBENCH')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(0)
  await page.waitForTimeout(700)
  await page.screenshot()
  await expect(loader).toHaveCount(0, { timeout:7000 })
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(0)
})

test('reduced motion skips the home loading animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.goto('/')
  await expect(page.locator('.site-loader')).toHaveCount(0)
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(1)
})
