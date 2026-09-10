import { test, expect } from '@playwright/test'

test('destination enters from corner contact until the curve fully exits', async ({ page }) => {
  await page.goto('/about')
  await page.getByRole('navigation').getByRole('link', { name:'Contact', exact:true }).click()
  await page.waitForFunction(() => document.getAnimations().some(a => a.animationName === 'route-curve'))
  const seek = time => page.evaluate(time => {
    document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => { a.pause(); a.currentTime = time })
  }, time)
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
  // The exposed lower half contains neither the destination navigation nor its links.
  expect(await pixels(partial, .55)).toBe(0)
  // The transition ends with the curve itself; the destination occupies its final .65s.
  const ends = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).map(a => a.effect.getComputedTiming().endTime))
  expect(Math.max(...ends)).toBeCloseTo(1950, 5)
  await seek(1300)
  const cornerContact = await page.screenshot({ path:'docs/qa/motion/white-handoff.png' })
  expect(await pixels(cornerContact, .55)).toBe(0)
  const entryStart = await page.evaluate(() => ({
    opacity:Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity),
    clip:getComputedStyle(document.documentElement,'::view-transition-old(root)').clipPath,
  }))
  expect(entryStart.opacity).toBe(0)
  expect(entryStart.clip).toContain('0%')
  await seek(1625)
  const overlap = await page.screenshot({ path:'docs/qa/motion/page-arrival-overlap.png' })
  expect(await pixels(overlap, .55)).toBeGreaterThan(0)
  const entryMiddle = await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))
  expect(entryMiddle).toBeGreaterThan(0)
  expect(entryMiddle).toBeLessThan(1)
  await seek(1950)
  const complete = await page.screenshot({ path:'docs/qa/motion/white-sequence-contact.png' })
  expect(await pixels(complete)).toBeGreaterThan(0)
  expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity))).toBe(1)
  await page.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement?.includes('view-transition')).forEach(a => a.finish()))
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  const title = page.locator('.reference-contact h1 .reveal-line')
  await expect(title).toBeVisible()
  expect(await title.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
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
