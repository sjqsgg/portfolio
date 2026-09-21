import { test, expect } from '@playwright/test'
import { createServer } from 'vite'

const settled = page => expect(page.locator('#root')).not.toHaveAttribute('data-transitioning', 'true')

test('full curved transition keeps its duration and Contact has its own layout', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/about')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-route-motion', 'page')
  await expect(page.locator('.reference-contact h1')).toHaveText('Let’s talk.')
  await page.waitForTimeout(750)
  await expect(page.locator('#root')).toHaveAttribute('data-transitioning', 'true')
  const effects = await page.evaluate(() => document.getAnimations().map(animation => ({ name: animation.animationName, duration: animation.effect.getTiming().duration, delay: animation.effect.getTiming().delay })))
  expect(effects).toContainEqual({ name:'route-curve-shape', duration:890, delay:420 })
  expect(effects).toContainEqual({ name:'route-backing-darken', duration:340, delay:0 })
  expect(effects).toContainEqual({ name:'route-backing-clear', duration:1, delay:420 })
  expect(effects).toContainEqual({ name:'route-finish', duration:1, delay:1177 })
  const pageEffects = effects.filter(effect => effect.name === 'route-page-reveal')
  expect(pageEffects).toHaveLength(1)
  expect(Math.round(pageEffects[0].delay)).toBe(1177)
  expect(pageEffects[0].duration).toBe(760)
  await page.screenshot()
  await settled(page)
  await expect(page.locator('.reference-about')).toHaveCount(0)
  await expect(page.locator('.contact-links a')).toHaveCount(2)
  await page.screenshot()
  await page.goBack(); await settled(page)
  await expect(page.locator('.reference-about')).toBeVisible()
  expect(errors).toEqual([])
})

test('motion controller migrates the saved white hold and controls content arrival', async ({ page }) => {
  const server = await createServer({ server:{ host:'127.0.0.1', port:4176, strictPort:true } })
  await server.listen()
  try {
    await page.addInitScript(() => {
      localStorage.setItem('jiaqi-motion-tuning-v1', JSON.stringify({ darken:490, hold:560, curve:990, finish:190 }))
    })
    await page.goto('http://127.0.0.1:4176/about?motiondev=1')
    const whiteHold = page.getByLabel('White screen hold value')
    const revealTime = page.getByLabel('Content reveal time value')
    const revealOffset = page.getByLabel('Content start offset value')
    await expect(whiteHold).toHaveValue('190')
    await expect(revealTime).toHaveValue('760')
    await expect(revealOffset).toHaveValue('60')
    await whiteHold.fill('260')
    await revealTime.fill('700')
    await revealOffset.fill('24')
    await expect(page.locator('.motion-dev-summary output')).toHaveText('2152 ms')
    expect(await page.evaluate(() => ({
      hold: document.documentElement.style.getPropertyValue('--route-finish-duration'),
      start: document.documentElement.style.getPropertyValue('--route-text-delay-base'),
      duration: document.documentElement.style.getPropertyValue('--route-text-duration'),
      offset: document.documentElement.style.getPropertyValue('--route-text-offset'),
    }))).toEqual({ hold:'1ms', start:'2152ms', duration:'700ms', offset:'24px' })
    await page.getByRole('button', { name:'Play preview' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-route-motion', 'page')
    await page.waitForFunction(() => document.getAnimations().some(animation => animation.animationName === 'route-page-reveal'))
    const effects = await page.evaluate(() => document.getAnimations().map(animation => ({
      name: animation.animationName,
      duration: animation.effect.getTiming().duration,
      delay: animation.effect.getTiming().delay,
    })))
    expect(effects).toContainEqual({ name:'route-finish', duration:1, delay:1892 })
    expect(effects).toContainEqual({ name:'route-page-reveal', duration:700, delay:2152 })
    await settled(page)

    await page.getByLabel('White screen hold value').fill('0')
    await expect(page.locator('.motion-dev-summary output')).toHaveText('1892 ms')
    await page.getByRole('button', { name:'Play preview' }).click()
    await page.waitForFunction(() => document.getAnimations().some(animation => animation.animationName === 'route-page-reveal'))
    const zeroHold = await page.evaluate(() => {
      const animations = document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition'))
      const timing = animations.filter(animation => ['route-finish','route-page-reveal'].includes(animation.animationName))
        .map(animation => ({ name:animation.animationName, delay:animation.effect.getTiming().delay }))
      animations.forEach(animation => { animation.pause(); animation.currentTime = 1900 })
      return {
        timing,
        oldOpacity:Number(getComputedStyle(document.documentElement,'::view-transition-old(root)').opacity),
        newOpacity:Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity),
        textOpacity:Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity),
      }
    })
    expect(zeroHold.timing).toContainEqual({ name:'route-finish', delay:1892 })
    expect(zeroHold.timing).toContainEqual({ name:'route-page-reveal', delay:1892 })
    expect(zeroHold.oldOpacity).toBe(0)
    expect(zeroHold.newOpacity).toBeGreaterThan(0)
    expect(zeroHold.textOpacity).toBeGreaterThan(0)
    await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes('view-transition')).forEach(animation => animation.finish()))
    await settled(page)
  } finally {
    await server.close()
  }
})

test('gallery expands the selected photograph and returns to the same strips and scroll position', async ({ page }) => {
  await page.goto('/photography')
  await page.waitForTimeout(1500)
  await expect(page.getByText(/Pause gallery|PHOTOGRAPHS|Hover to pause|For commissions/)).toHaveCount(0)
  await expect(page.locator('.gallery-row-heading h2').first()).toHaveText('Portraits')
  await expect(page.locator('.gallery-row-heading h2').last()).toHaveText('Selected moments')
  const link = page.locator('.gallery-group').first().getByRole('link').nth(2)
  await link.focus()
  await page.waitForTimeout(650)
  const before = await page.locator('.gallery-track').evaluateAll(els => els.map(el => Number(el.dataset.offset)))
  const scroll = await page.evaluate(() => window.scrollY)
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-route-motion','photo-open')
  await expect(page.locator('.series-selected img')).toHaveAttribute('data-photo-id','portrait-03')
  await page.waitForTimeout(150)
  const names = await page.evaluate(() => document.getAnimations().map(a => a.effect?.pseudoElement))
  expect(names).toContain('::view-transition-group(selected-photo)')
  await page.screenshot()
  await settled(page)
  await page.getByRole('link', { name:'Back to gallery', exact:true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-route-motion','photo-close')
  await page.waitForTimeout(100)
  const restored = await page.locator('.gallery-track').evaluateAll(els => els.map(el => Number(el.dataset.offset)))
  // Only a few milliseconds elapse between keyboard activation and the outgoing capture.
  expect(Math.abs(restored[0] - before[0])).toBeLessThan(2)
  expect(Math.abs(restored[1] - before[1])).toBeLessThan(5)
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
  await settled(page)
  await page.screenshot()
})

test('photography navigation stays available, cursor is contextual, and mobile stays clear', async ({ page }) => {
  await page.goto('/photography')
  await page.waitForTimeout(1400)
  const image = page.locator('.gallery-group').first().getByRole('link').nth(1)
  const box = await image.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('.follow-cursor')).toHaveAttribute('data-visible','true')
  await expect(page.locator('.follow-cursor')).toHaveText('View photograph↗')
  await page.mouse.move(650,30)
  await expect(page.locator('.follow-cursor')).not.toHaveAttribute('data-visible','true')
  await page.setViewportSize({ width:390, height:600 })
  await page.evaluate(() => window.scrollTo(0,300))
  expect(await page.locator('.canvas-identity').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.screenshot()
  await page.goto('/contact')
  await page.setViewportSize({ width:390,height:844 })
  await page.waitForTimeout(1200)
  await page.screenshot()
})

test('reduced motion and a browser without snapshot transitions still navigate and return', async ({ page }) => {
  await page.addInitScript(() => { document.startViewTransition = undefined })
  await page.goto('/photography')
  await page.locator('.gallery-group').first().getByRole('link').nth(1).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.series-selected img')).toHaveAttribute('data-photo-id','portrait-02')
  await page.getByRole('link',{name:'Back to gallery',exact:true}).click()
  await expect(page.locator('.gallery-track')).toHaveCount(2)
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Contact',exact:true}).click()
  await expect(page.locator('.reference-contact')).toBeVisible()
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning')
  await expect(page.locator('.follow-cursor')).toBeHidden()
})


test('static mobile gallery remembers horizontal position after opening and closing a photo', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 })
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.goto('/photography')
  const row = page.locator('.gallery-viewport').first()
  await row.evaluate(el => { el.scrollLeft = 300 })
  const photo = row.getByRole('link').nth(2)
  await photo.click()
  await expect(page.locator('.series-selected img')).toHaveAttribute('data-photo-id','portrait-03')
  await page.getByRole('link',{name:'Back to gallery',exact:true}).click()
  await expect(page.locator('.gallery-viewport').first()).toHaveJSProperty('scrollLeft',300)
})
