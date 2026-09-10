import { test, expect } from '@playwright/test'

test('GitHub Pages subpath loads the model, routes, photographs and CV', async ({ page }) => {
  const failed = []
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
  await page.goto('http://127.0.0.1:4180/portfolio/')
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout:30000 })
  await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'About', exact:true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:4180/portfolio/about')
  await expect(page.locator('.reference-about')).toBeVisible({ timeout:5000 })
  const cv = page.getByRole('link', { name:'Download my CV', exact:true })
  await expect(cv).toHaveAttribute('href', '/portfolio/documents/jiaqi-shi-cv-2026.pdf')
  await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'Photography', exact:true }).click()
  await expect(page.locator('.gallery-photo img').first()).toBeVisible({ timeout:5000 })
  expect(failed).toEqual([])
})
