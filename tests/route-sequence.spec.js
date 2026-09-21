import { test, expect } from '@playwright/test'

test('page darkens, holds, clears to white, then all destination content enters together', async ({ page }) => {
  await page.goto('/about')
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await page.waitForFunction(() => document.getAnimations().some(a => ['route-curve-shape','route-curve-fallback'].includes(a.animationName)))
  const seek = time => page.evaluate(time => {
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = time })
  }, time)
  await seek(400)
  const precurve = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement, '::view-transition-old(root)')
    const backing = getComputedStyle(document.documentElement, '::view-transition-image-pair(root)')
    const path = css.clipPath.match(/line to 100% ([-+\de.]+)px, curve to 0% [-+\de.]+px with 50% ([-+\de.]+)px/)
    const brightness = css.filter.match(/brightness\(([-+\de.]+)\)/)
    return { edge:path ? Number(path[1]) : null, control:path ? Number(path[2]) : null, brightness:brightness ? Number(brightness[1]) : null, backing:backing.backgroundColor, height:innerHeight }
  })
  expect(precurve.edge).toBeGreaterThan(precurve.height)
  expect(precurve.control).toBeGreaterThan(precurve.height)
  expect(precurve.brightness).toBeGreaterThan(.3)
  expect(precurve.brightness).toBeLessThan(.34)
  expect(precurve.backing).toBe('rgb(82, 82, 82)')
  await page.screenshot()
  await seek(700)
  const duringCurve = await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))
  expect(duringCurve).toBe(0)
  await page.screenshot()
  const timeline = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).map(a => ({name:a.animationName,end:a.effect.getComputedTiming().endTime})))
  const curve = timeline.find(item => item.name === 'route-curve-shape')
  const newRoot = timeline.find(item => item.name === 'route-page-reveal')
  expect(curve.end).toBeCloseTo(1310, 5)
  expect(newRoot.end).toBeCloseTo(1937, 5)
  const curveSamples = await page.evaluate(() => {
    const animations = document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition'))
    const axis = Math.max(innerWidth, innerHeight)
    return Array.from({ length:31 }, (_, index) => {
      animations.forEach(animation => { animation.currentTime = 420 + index * (890 / 30) })
      const clipPath = getComputedStyle(document.documentElement, '::view-transition-old(root)').clipPath
      const match = clipPath.match(/line to 100% ([-+\de.]+)px, curve to 0% [-+\de.]+px with 50% ([-+\de.]+)px/)
      return match ? { edge:100 * Number(match[1]) / axis, control:100 * Number(match[2]) / axis } : null
    })
  })
  expect(curveSamples.every(Boolean)).toBe(true)
  curveSamples.slice(1).forEach((sample, index) => {
    expect(sample.edge).toBeLessThanOrEqual(curveSamples[index].edge + .01)
    expect(sample.control).toBeLessThanOrEqual(curveSamples[index].control + .01)
    expect(curveSamples[index].edge - sample.edge).toBeLessThan(12)
    expect(curveSamples[index].control - sample.control).toBeLessThan(12)
  })
  expect(curveSamples[6].edge).toBeGreaterThan(70)
  expect(curveSamples[18].edge).toBeLessThan(7)
  await seek(1180)
  const whitePause = await page.evaluate(() => ({
    oldOpacity:Number(getComputedStyle(document.documentElement,'::view-transition-old(root)').opacity),
    newOpacity:Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity),
  }))
  expect(whitePause.oldOpacity).toBe(0)
  expect(whitePause.newOpacity).toBeGreaterThan(0)
  expect(whitePause.newOpacity).toBeLessThan(.05)
  await seek(1500)
  const entry = await page.evaluate(() => ({
    clip:getComputedStyle(document.documentElement,'::view-transition-old(root)').clipPath,
    opacity:Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity),
  }))
  expect(entry.clip).toContain('px')
  expect(entry.opacity).toBeGreaterThan(0)
  expect(entry.opacity).toBeLessThan(1)
  await page.screenshot()
  await seek(2100)
  const complete = await page.screenshot()
  expect(complete.length).toBeGreaterThan(0)
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))).toBe(1)
  await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  const title = page.locator('.reference-contact h1 .reveal-line')
  await expect(title).toBeVisible()
  expect(await title.evaluate(el => getComputedStyle(el).opacity)).toBe('1')
})

test('portrait transition keeps a full-height dark hold before its mobile curve rises', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 })
  await page.goto('/about')
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await page.waitForFunction(() => document.getAnimations().some(animation => animation.animationName === 'route-curve-portrait'))
  const sampleBottom = async screenshot => page.evaluate(async url => {
    const image = new Image(); image.src = url; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
    return [...context.getImageData(Math.floor(image.width / 2), image.height - 2, 1, 1).data.slice(0, 3)]
  }, `data:image/png;base64,${screenshot.toString('base64')}`)
  await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition')).forEach(animation => { animation.pause(); animation.currentTime = 400 }))
  const hold = await page.screenshot()
  expect(Math.max(...await sampleBottom(hold))).toBeLessThan(180)
  const timing = await page.evaluate(() => {
    const animation = document.getAnimations().find(item => item.animationName === 'route-curve-portrait')
    return { duration:animation.effect.getTiming().duration, delay:animation.effect.getTiming().delay }
  })
  expect(timing).toEqual({ duration:890, delay:420 })
  await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition')).forEach(animation => { animation.currentTime = 800 }))
  await page.screenshot()
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))).toBe(0)
  await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition')).forEach(animation => { animation.currentTime = 1180 }))
  await page.screenshot()
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-old(root)').opacity))).toBe(0)
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))).toBeGreaterThan(0)
  await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition')).forEach(animation => animation.finish()))
})

test('quick history navigation and skipped capture do not leave the destination blank', async ({ page }) => {
  await page.goto('/about')
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-route-motion', 'page')
  await page.goBack()
  await expect(page.locator('.reference-about')).toBeVisible()
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning', { timeout:5000 })
  await expect.poll(() => page.locator('#root').evaluate(el => getComputedStyle(el).opacity)).toBe('1')
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = update => { const transition = start(update); transition.skipTransition(); return transition }
  })
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await expect(page.locator('.reference-contact')).toBeVisible()
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  await expect.poll(() => page.locator('.reference-contact h1 .reveal-line').evaluate(el => getComputedStyle(el).opacity)).toBe('1')
})

test('rapid navigation input cannot start a second dark snapshot', async ({ page }) => {
  await page.goto('/about')
  const nav = page.getByRole('navigation')
  const projectBox = await nav.getByRole('link', { name:'Projects', exact:true }).boundingBox()
  await nav.getByRole('link', { name:'Contact', exact:true }).click()
  await expect(page.locator('#root')).toHaveAttribute('data-transitioning', 'true')
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(true)
  expect(await nav.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')
  await page.mouse.click(projectBox.x + projectBox.width / 2, projectBox.y + projectBox.height / 2)
  await expect(page).toHaveURL(/\/contact$/)
  await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  await expect(page.locator('.reference-contact')).toBeVisible()
})
