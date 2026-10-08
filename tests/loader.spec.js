import { test, expect } from '@playwright/test'
import { sceneViews } from '../src/portfolio/sceneViews'

test('home opens from a miniature and settles at the ordinary overview', async ({ page }) => {
  await page.goto('/')
  const loader = page.locator('.site-loader')
  await expect(loader).toBeVisible()
  await expect(loader.getByText('OPENING WORKBENCH')).toBeVisible()
  await expect(page.locator('.site-loader-workbench')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(0)
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout:25000 })
  const miniature = Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))
  const normal = Math.hypot(...sceneViews.overview.position.map((n, i) => n - sceneViews.overview.target[i]))
  expect(miniature).toBeGreaterThan(normal * 1.5)
  await expect(loader).toHaveCount(0, { timeout:5000 })
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving', 'false')
  expect(Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))).toBeCloseTo(normal, 4)
  await expect(page.locator('.immersive-home')).not.toHaveAttribute('inert')
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(0)
})

test('slow model keeps the breathing preview after five seconds, then falls back on failure', async ({ page }) => {
  let release
  const held = new Promise(resolve => { release = resolve })
  await page.route('**/models/workstation-v003.glb', async route => { await held; await route.abort() })
  try {
    await page.goto('/')
    await expect(page.locator('.site-loader-workbench')).toBeVisible()
    await page.waitForTimeout(5600)
    await expect(page.locator('.site-loader')).toHaveClass(/is-loading/)
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'loading')
    const breathing = await page.locator('.site-loader-workbench').evaluate(node => {
      const animation = node.getAnimations()[0]
      animation.pause(); animation.currentTime = 550
      const bright = Number(getComputedStyle(node).opacity)
      animation.currentTime = 1850
      const dim = Number(getComputedStyle(node).opacity)
      return { bright, dim, complete: node.complete, width: node.naturalWidth }
    })
    expect(breathing.complete).toBe(true)
    expect(breathing.width).toBeGreaterThan(0)
    expect(breathing.bright - breathing.dim).toBeGreaterThan(.15)
    release()
    await expect(page.locator('.workbench-poster')).toBeVisible()
    await expect(page.locator('.site-loader')).toHaveCount(0)
    await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'Projects', exact:true }).click()
    await expect(page).toHaveURL(/\/projects$/)
  } finally { release() }
})

for (const mobile of [false, true]) {
  test(`WebGL failure displays the current ${mobile ? 'mobile' : 'desktop'} poster`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width:390, height:844 })
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : getContext.call(this, type, ...args) }
    })
    await page.goto('/')
    await expect(page.locator('.workbench-poster')).toBeVisible()
    await expect(page.locator('.site-loader')).toHaveCount(0)
    expect(await page.locator('.workbench-poster img').evaluate(img => img.currentSrc)).toContain(`overview-${mobile ? 'mobile' : 'day'}.webp`)
    await expect(page.locator('.immersive-home')).not.toHaveAttribute('inert')
  })
}

test('reduced motion skips the home loading animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.goto('/')
  await expect(page.locator('.site-loader')).toHaveCount(0)
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(1)
})

test('data saving uses current posters for every view without downloading the model', async ({ page }) => {
  let modelRequested = false
  page.on('request', request => { if (request.url().endsWith('/models/workstation-v003.glb')) modelRequested = true })
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
  await page.goto('/')
  await expect(page.locator('.site-loader')).toHaveCount(0)
  await expect(page.locator('.workbench-poster img')).toHaveAttribute('src', /overview-day\.webp$/)
  for (const [anchor, view] of [['monitor', 'work'], ['camera', 'photo']]) {
    await page.locator(`[data-anchor="${anchor}"]`).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.workbench-poster img')).toHaveAttribute('src', new RegExp(`${view}-day\\.webp$`))
  }
  expect(modelRequested).toBe(false)
})
