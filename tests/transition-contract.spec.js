import { test, expect } from '@playwright/test'

async function seek(page, ms) {
  await page.waitForFunction(() => document.getAnimations().some(a => a.animationName === 'route-page-reveal'))
  await page.evaluate(ms => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => {
    a.pause(); a.currentTime = ms
  }), ms)
}

async function bottomPixels(page) {
  const shot = await page.screenshot()
  return page.evaluate(async encoded => {
    const image = new Image()
    image.src = `data:image/png;base64,${encoded}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d', { willReadFrequently:true })
    ctx.drawImage(image, 0, 0)
    return [0.1,0.5,0.9].flatMap(x => [2,8,24].map(bottom => {
      const data = ctx.getImageData(Math.floor(image.width * x), image.height - bottom, 1, 1).data
      return Math.max(...data.slice(0,3))
    }))
  }, shot.toString('base64'))
}

for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  test(`Home outgoing curtain covers every bottom edge at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('.site-loader')).toHaveCount(0, { timeout:30000 })
    for (const label of ['Projects','Photography','About','Contact']) {
      await page.getByRole('navigation', {name:'Main navigation'}).getByRole('link', {name:label,exact:true}).click()
      await seek(page, 400)
      expect(Math.max(...await bottomPixels(page)), `${label}: white strip during dark hold`).toBeLessThan(190)
      const snapshots = await page.evaluate(() => ({
        nav:getComputedStyle(document.documentElement,'::view-transition-new(site-navigation)').opacity,
        page:getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity,
      }))
      expect(Number(snapshots.nav)).toBe(1)
      expect(Number(snapshots.page)).toBe(0)
      await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
      await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
      await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Home',exact:true}).click()
      await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning',{timeout:8000})
    }
  })
}

for (const route of ['projects','photography','about','contact']) {
  test(`${route} returns with its navigation visible and page content on one clock`, async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:route[0].toUpperCase()+route.slice(1),exact:true}).click()
    await seek(page, 1500)
    const state = await page.evaluate(() => ({
      root: getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity,
      nav: getComputedStyle(document.documentElement,'::view-transition-new(site-navigation)').opacity,
      effects:document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).map(a => a.animationName),
    }))
    expect(Number(state.nav)).toBe(1)
    expect(Number(state.root)).toBeGreaterThan(0)
    expect(state.effects).toContain('route-page-reveal')
    expect(state.effects).not.toContain('route-text-snapshot')
    await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
    await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  })
}

test('Home returns without the mismatched poster and still reveals its 3D canvas', async ({ page }) => {
  await page.goto('/about')
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Home',exact:true}).click()
  await expect(page.locator('.workbench-poster')).toHaveCount(0)
  await expect(page.locator('.workbench-canvas[data-state="ready"]')).toBeVisible({timeout:25000})
  await expect.poll(() => page.locator('.workbench-canvas canvas').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1)
})
