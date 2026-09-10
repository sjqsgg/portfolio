import { test, expect } from '@playwright/test'
import process from 'node:process'

const pagesUrl = process.env.PAGES_TEST_URL?.replace(/\/$/, '')

test('GitHub Pages subpath loads the model, routes, photographs and CV', async ({ page }) => {
  test.skip(!pagesUrl, 'Set PAGES_TEST_URL to verify a deployed build')
  const failed = []
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
  await page.goto(`${pagesUrl}/`)
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout:30000 })
  await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'About', exact:true }).click()
  await expect(page).toHaveURL(`${pagesUrl}/about`)
  await expect(page.locator('.reference-about')).toBeVisible({ timeout:5000 })
  const cv = page.getByRole('link', { name:'Download my CV', exact:true })
  const basePath = new URL(pagesUrl).pathname.replace(/\/$/, '')
  await expect(cv).toHaveAttribute('href', `${basePath}/documents/jiaqi-shi-cv-2026.pdf`)
  await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'Photography', exact:true }).click()
  await expect(page.locator('.gallery-photo img').first()).toBeVisible({ timeout:5000 })
  expect(failed).toEqual([])
})
