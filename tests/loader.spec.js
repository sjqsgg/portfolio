import { test, expect } from '@playwright/test'
import { sceneViews } from '../src/portfolio/sceneViews'

test('letter loader hands off to the normal overview using the page transition', async ({ page }) => {
  const previewRequests = []
  page.on('request', request => { if (/\/intro-(day|mobile)\.webp/.test(request.url())) previewRequests.push(request.url()) })
  await page.addInitScript(() => {
    window.loaderTiming = {}
    let word
    new MutationObserver(() => {
      const timing = window.loaderTiming
      word ||= document.querySelector('.site-loader-word')
      if (!timing.ready && document.querySelector('.workbench-canvas[data-state="ready"]')) timing.ready = performance.now()
      if (!timing.revealing && document.querySelector('.home[data-entrance="revealing"]')) { timing.revealing = performance.now(); timing.finalLetterPhase = word?.dataset.phase }
      if (timing.ready && !timing.done && document.querySelector('.home[data-entrance="done"]')) timing.done = performance.now()
    }).observe(document, { subtree:true, childList:true, attributes:true })
  })
  await page.goto('/')
  const loader = page.locator('.site-loader')
  await expect(loader).toBeVisible()
  await expect(page.getByRole('status', { name:'Loading the workbench' })).toBeVisible()
  await expect(page.locator('.site-loader-word')).toHaveText('Loading...')
  await expect(loader.locator('img, canvas')).toHaveCount(0, { timeout:10000 })
  await expect(page.locator('.workbench-poster')).toHaveCount(0, { timeout:10000 })
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout:25000 })
  const normal = Math.hypot(...sceneViews.overview.position.map((n, i) => n - sceneViews.overview.target[i]))
  expect(Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))).toBeCloseTo(normal, 4)
  await expect(loader).toHaveCount(0, { timeout:10000 })
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving', 'false')
  expect(Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))).toBeCloseTo(normal, 4)
  await expect(page.locator('.immersive-home')).not.toHaveAttribute('inert')
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(0, { timeout:10000 })
  expect(previewRequests).toEqual([])
  const timing = await page.evaluate(() => window.loaderTiming)
  // The loader uses the same approximately 1.94s curtain/reveal as page changes.
  expect(timing.finalLetterPhase).toBe('finished')
  expect(timing.revealing).toBeGreaterThanOrEqual(timing.ready)
  expect(timing.done - timing.revealing).toBeGreaterThan(1700)
  expect(timing.done - timing.revealing).toBeLessThan(3500)
})

for (const width of [1440, 390]) test(`domino loop stays usable at ${width}px during slow loading and failure`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height:width === 390 ? 844 : 1000 })
  let release
  const held = new Promise(resolve => { release = resolve })
  await page.route('**/models/workstation-v003.glb', async route => { await held; await route.abort() })
  try {
    await page.goto('/')
    await expect(page.locator('.site-loader-word')).toBeVisible()
    for (const selector of ['.canvas-identity', '.canvas-base', '.canvas-revert', '.skip-link', '.follow-cursor']) await expect(page.locator(selector)).toBeHidden()
    await expect(page.locator('.site-loader')).toHaveClass(/is-loading/)
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'loading')
    const layout = await page.locator('.site-loader').evaluate(node => ({
      background:getComputedStyle(node).backgroundColor,
      canvas:getComputedStyle(document.documentElement).backgroundColor,
      color:getComputedStyle(node).color,
      overflow:document.documentElement.scrollWidth > innerWidth,
    }))
    expect(layout.background).toBe('rgb(255, 255, 255)')
    expect(layout.background).toBe(layout.canvas)
    expect(layout.color).toBe('rgb(11, 11, 10)')
    expect(layout.overflow).toBe(false)
    await page.waitForFunction(() => {
      const angles = [...document.querySelectorAll('.site-loader-letter')].map(node => {
        const matrix = new DOMMatrix(getComputedStyle(node).transform)
        return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
      })
      return angles[0] > 50 && angles.at(-1) < 1
    })
    await page.screenshot({ path:testInfo.outputPath('domino-chain.png') })
    await expect(page.locator('.site-loader-word')).toHaveAttribute('data-phase', 'holding')
    const fallen = await page.locator('.site-loader-letter').last().evaluate(node => {
      const matrix = new DOMMatrix(getComputedStyle(node).transform)
      return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
    })
    expect(fallen).toBeCloseTo(58, 1)
    await page.waitForFunction(() => {
      const letters = document.querySelectorAll('.site-loader-letter')
      const angle = node => {
        const matrix = new DOMMatrix(getComputedStyle(node).transform)
        return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
      }
      return angle(letters[0]) < -1 && angle(letters[letters.length - 1]) > 50
    })
    await page.screenshot({ path:testInfo.outputPath('domino-rebound.png') })
    // Observe every frame: assertion backoff can skip the short 250ms rest.
    await page.waitForFunction(() => document.querySelector('.site-loader-word')?.dataset.phase === 'resting')
    await page.screenshot({ path:testInfo.outputPath('domino-upright.png') })
    await expect(page.locator('.site-loader-word')).toHaveAttribute('data-phase', 'falling', { timeout:2000 })
    release()
    await expect(page.locator('.workbench-poster')).toBeVisible()
    await page.waitForFunction(() => document.getAnimations().some(a => a.animationName === 'route-page-reveal'))
    const curve = await page.evaluate(() => {
      const animations = document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition'))
      animations.forEach(a => { a.pause(); a.currentTime = 800 })
      return animations.map(a => ({ name:a.animationName, duration:a.effect.getTiming().duration, delay:a.effect.getTiming().delay }))
    })
    expect(curve).toContainEqual({ name:width === 390 ? 'route-curve-portrait' : 'route-curve-shape', duration:890, delay:420 })
    expect(curve).toContainEqual({ name:'route-page-reveal', duration:760, delay:1177 })
    await expect(page.locator('.canvas-identity')).toHaveCSS('view-transition-name', 'none')
    await page.screenshot({ path:testInfo.outputPath('entrance-curve.png') })
    await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => { a.currentTime = 1650 }))
    await page.screenshot({ path:testInfo.outputPath('entrance-white-reveal.png') })
    await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
    await expect(page.locator('.site-loader')).toHaveCount(0, { timeout:10000 })
    await expect(page.locator('.home')).toHaveAttribute('data-entrance', 'done', { timeout:10000 })
    await expect(page.locator('.canvas-identity')).toHaveCSS('view-transition-name', 'site-navigation')
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
    await expect(page.locator('.site-loader')).toHaveCount(0, { timeout:10000 })
    expect(await page.locator('.workbench-poster img').evaluate(img => img.currentSrc)).toContain(`overview-${mobile ? 'mobile' : 'day'}.webp`)
    await expect(page.locator('.immersive-home')).not.toHaveAttribute('inert')
  })
}

test('reduced motion skips the home loading animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.goto('/')
  await expect(page.locator('.site-loader')).toHaveCount(0, { timeout:10000 })
  await expect(page.locator('.immersive-home')).toBeVisible()
  await expect(page.locator('.workbench-poster')).toHaveCount(1)
})

test('data saving uses current posters for every view without downloading the model', async ({ page }) => {
  let modelRequested = false
  page.on('request', request => { if (request.url().endsWith('/models/workstation-v003.glb')) modelRequested = true })
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
  await page.goto('/')
  await expect(page.locator('.site-loader')).toHaveCount(0, { timeout:10000 })
  await expect(page.locator('.home')).toHaveAttribute('data-entrance', 'done', { timeout:10000 })
  await expect(page.locator('.workbench-poster img')).toHaveAttribute('src', /overview-day\.webp$/)
  for (const [anchor, view] of [['monitor', 'work'], ['camera', 'photo']]) {
    await page.locator(`[data-anchor="${anchor}"]`).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.workbench-poster img')).toHaveAttribute('src', new RegExp(`${view}-day\\.webp$`))
  }
  expect(modelRequested).toBe(false)
})

test('entrance without View Transitions releases navigation after its fallback', async ({ page }) => {
  await page.addInitScript(() => {
    document.startViewTransition = undefined
    Object.defineProperty(navigator, 'connection', { value:{ saveData:true }, configurable:true })
  })
  await page.goto('/')
  await expect(page.locator('.home')).toHaveAttribute('data-entrance', 'done', { timeout:10000 })
  await expect(page.locator('#root')).not.toHaveAttribute('inert')
  await expect(page.locator('.canvas-identity')).toBeVisible()
  await page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'Projects', exact:true }).click()
  await expect(page).toHaveURL(/\/projects$/)
})
