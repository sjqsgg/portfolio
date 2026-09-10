import { test, expect } from '@playwright/test'

test('page darkens before the curve appears, then destination text enters line by line', async ({ page }) => {
  await page.goto('/about')
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await page.waitForFunction(() => document.getAnimations().some(a => ['route-curve-shape','route-curve-fallback'].includes(a.animationName)))
  const seek = time => page.evaluate(time => {
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = time })
  }, time)
  await seek(400)
  const precurve = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement, '::view-transition-old(root)')
    const path = css.clipPath.match(/line to 100% ([-+\de.]+)px, curve to 0% [-+\de.]+px with 50% ([-+\de.]+)px/)
    const brightness = css.filter.match(/brightness\(([-+\de.]+)\)/)
    return { edge:path ? Number(path[1]) : null, control:path ? Number(path[2]) : null, brightness:brightness ? Number(brightness[1]) : null, height:innerHeight }
  })
  expect(precurve.edge).toBeGreaterThan(precurve.height)
  expect(precurve.control).toBeGreaterThan(precurve.height)
  expect(precurve.brightness).toBeGreaterThan(.34)
  expect(precurve.brightness).toBeLessThan(.4)
  await page.screenshot({ path:'docs/qa/motion/dark-precurve-0400.png' })
  await seek(900)
  const hiddenAtStart = await page.evaluate(() => getComputedStyle(document.documentElement,'::view-transition-new(route-text-0)').clipPath)
  expect(hiddenAtStart).toContain('0% 100%')
  await seek(1050)
  const partial = await page.screenshot({ path:'docs/qa/motion/white-reveal-middle.png' })
  const pixels = async (screenshot, top = 0) => page.evaluate(async ({ url, top }) => {
    const image = new Image(); image.src = url; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, Math.floor(image.height * top), image.width, image.height - Math.floor(image.height * top)).data
    let nonWhite = 0
    for (let i = 0; i < data.length; i += 4) if (Math.min(data[i], data[i+1], data[i+2]) < 250) nonWhite++
    return nonWhite
  }, { url:`data:image/png;base64,${screenshot.toString('base64')}`, top })
  // Destination text is already entering line by line over the exposed white page.
  expect(await pixels(partial, .55)).toBeGreaterThan(0)
  const timeline = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).map(a => ({name:a.animationName,end:a.effect.getComputedTiming().endTime})))
  expect(timeline.find(item => item.name === 'route-curve-shape').end).toBeCloseTo(1950, 5)
  const curveSamples = await page.evaluate(() => {
    const animations = document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition'))
    const axis = Math.max(innerWidth, innerHeight)
    return Array.from({ length:31 }, (_, index) => {
      animations.forEach(animation => { animation.currentTime = index * 65 })
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
  await seek(1200)
  const textArrival = await page.screenshot({ path:'docs/qa/motion/text-arrival-1200.png' })
  expect(await pixels(textArrival, .55)).toBeGreaterThan(0)
  const entry = await page.evaluate(() => ({
    clip:getComputedStyle(document.documentElement,'::view-transition-old(root)').clipPath,
    lines:[0,1,2].map(index => Number(getComputedStyle(document.documentElement,`::view-transition-new(route-text-${index})`).opacity)),
  }))
  expect(entry.clip).toContain('px')
  expect(entry.lines[0]).toBeGreaterThan(entry.lines[1])
  expect(entry.lines[1]).toBeGreaterThan(entry.lines[2])
  expect(entry.lines[2]).toBeGreaterThan(0)
  await seek(1700)
  const overlap = await page.screenshot({ path:'docs/qa/motion/page-arrival-overlap.png' })
  expect(await pixels(overlap, .55)).toBeGreaterThan(0)
  await seek(1950)
  const complete = await page.screenshot({ path:'docs/qa/motion/white-sequence-contact.png' })
  expect(await pixels(complete)).toBeGreaterThan(0)
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))).toBe(1)
  await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  const title = page.locator('.reference-contact h1 .reveal-line')
  await expect(title).toBeVisible()
  expect(await title.evaluate(el => getComputedStyle(el).opacity)).toBe('1')
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
