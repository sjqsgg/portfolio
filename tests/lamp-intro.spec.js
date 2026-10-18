import { test, expect } from '@playwright/test'

test.use({ hasTouch: true })

for (const mobile of [false, true]) {
  test(`lamp welcomes visitors on ${mobile ? 'mobile' : 'desktop'} and restores the desk`, async ({ page }, testInfo) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/?lampintro=1')
    const canvas = page.locator('.workbench-canvas')
    await expect(canvas).toHaveAttribute('data-state', 'ready', { timeout: 25000 })
    await expect(page.locator('.home')).toHaveAttribute('data-entrance', 'done', { timeout: 15000 })
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'projects')
    await page.waitForFunction(() => Number(document.querySelector('.workbench-canvas').dataset.lampIntroTime) > 1300)
    const projects = page.locator('[data-intro-anchor="monitor"]')
    await expect(projects).toHaveCSS('opacity', '1')
    await page.screenshot({ path: testInfo.outputPath('01-projects.png') })
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'photography')
    await page.waitForFunction(() => Number(document.querySelector('.workbench-canvas').dataset.lampIntroTime) > 3100)
    const photography = page.locator('[data-intro-anchor="camera"]')
    await expect(photography).toHaveCSS('opacity', '1')
    const box = await photography.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(mobile ? 390 : 1440)
    await page.screenshot({ path: testInfo.outputPath('02-photography.png') })
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'opening')
    await page.waitForFunction(() => Number(document.querySelector('.workbench-canvas').dataset.lampIntroTime) > 4700)
    await page.screenshot({ path: testInfo.outputPath('02b-daybreak.png') })
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'done', { timeout: 10000 })
    expect(await page.locator('.home').evaluate(node => node.style.getPropertyValue('--lamp-darkness'))).toBe('0')
    await page.screenshot({ path: testInfo.outputPath('03-daylight.png') })
    await page.getByRole('button', { name: 'Replay opening' }).click()
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'opening', { timeout: 10000 })
    await page.waitForFunction(() => Number(document.querySelector('.workbench-canvas').dataset.lampIntroTime) > 4700)
    if (mobile) await canvas.tap({ position: { x: 20, y: 200 } })
    else await canvas.click({ position: { x: 20, y: 200 } })
    await expect(canvas).toHaveAttribute('data-lamp-intro', 'done')
    await page.screenshot({ path: testInfo.outputPath('04-skipped-daylight.png') })
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Photography', exact: true }).click()
    await expect(page).toHaveURL(/\/photography$/)
    await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('reduced motion uses the lit static desk without the lamp sequence', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?lampintro=1')
  await expect(page.locator('.workbench-poster')).toBeVisible()
  await expect(page.locator('.workbench-canvas')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Replay opening' })).toHaveCount(0)
})

test('returning home does not repeat the welcome sequence', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-lamp-intro', 'projects', { timeout: 30000 })
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await nav.getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Let’s talk.' })).toBeVisible()
  await nav.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout: 25000 })
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-lamp-intro', 'done')
  await expect(page.locator('.home')).not.toHaveAttribute('inert')
})

test('failed WebGL leaves a lit usable fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.includes('webgl') ? null : getContext.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await expect(page.locator('.workbench-poster')).toBeVisible()
  await expect(page.locator('.home')).toHaveAttribute('data-entrance', 'done', { timeout: 15000 })
  await expect(page.locator('.home')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Photography', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible()
})
