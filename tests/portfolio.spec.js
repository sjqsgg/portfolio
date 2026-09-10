import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function ready(page) {
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving', 'false')
}
async function activate(page, target) { await target.focus(); await page.keyboard.press('Enter') }
async function switchView(page, name) {
  const id = String(name).includes('Work & ideas') ? 'monitor' : 'camera'
  await activate(page, page.locator(`[data-anchor="${id}"]`))
  await ready(page)
}

test('actual monitor and camera meshes move to their views, then open their destinations', async ({ page }) => {
  for (const [anchor, view, destination] of [['monitor', 'work', '/projects'], ['camera', 'photo', '/photography']]) {
    await page.goto('/')
    await ready(page)
    async function meshClick() {
      const point = await page.locator(`[data-anchor="${anchor}"]`).evaluate(label => ({ x: Number(label.dataset.meshX), y: Number(label.dataset.meshY) }))
      await page.mouse.click(point.x, point.y)
    }
    await meshClick()
    await expect(page.locator('.home')).toHaveAttribute('data-view', view)
    await ready(page)
    await meshClick()
    await expect(page).toHaveURL(destination)
  }
})

test('lamp and views return, and the camera flash opens photography', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await ready(page)
  await activate(page, page.getByRole('button', { name: 'Desk lamp: switch to night mode' }))
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night')
  await switchView(page, /Work & ideas/)
  await page.getByRole('button', { name: 'Revert', exact:true }).click()
  await expect(page.locator('.home')).toHaveAttribute('data-view', 'overview')
  await ready(page)
  await page.screenshot({ path: 'docs/qa/v2/home-night.png' })
  await switchView(page, /Through the lens/)
  await activate(page, page.locator('[data-anchor="camera"]'))
  await expect(page.locator('.camera-transition')).toBeVisible()
  await expect(page).toHaveURL('/photography')
  await expect(page.locator('.camera-transition')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day')
  expect(errors).toEqual([])
})

test('CV and badge lift, open accessible documents, and put back with focus restored', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await switchView(page, /Work & ideas/)
  for (const [anchor, kind] of [['cv','cv'],['badge','badge']]) {
    const trigger = page.locator(`[data-anchor="${anchor}"]`)
    await activate(page, trigger)
    await expect(page.locator('.home')).toHaveAttribute('data-object', kind)
    await expect(page.getByRole('dialog')).toBeVisible()
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
    expect(a11y.violations).toEqual([])
    await page.screenshot({ path: `docs/qa/v2/document-${kind}.png` })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await ready(page)
  }
})

test('guestbook draft survives closing and reload, email stays an explicit link', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await switchView(page, /Through the lens/)
  await activate(page, page.getByRole('button', { name: 'Leave a note' }))
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Your note').fill('Hello Jiaqi! A quiet place by the sea.')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByRole('status').last()).toHaveText('Draft saved on this device.')
  await expect(page.getByRole('link', { name: 'Open in email' })).toHaveAttribute('href', /body=Hello%20Jiaqi/)
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(a11y.violations).toEqual([])
  await page.screenshot({ path: 'docs/qa/v2/guestbook.png' })
  await page.getByRole('button', { name: 'Put back on the desk' }).click()
  await page.reload()
  await ready(page)
  await switchView(page, /Through the lens/)
  await activate(page, page.getByRole('button', { name: 'Leave a note' }))
  await expect(page.getByLabel('Your note')).toHaveValue('Hello Jiaqi! A quiet place by the sea.')
})

test('gallery moves in opposite directions, pauses, drags, and opens the complete selected series', async ({ page }) => {
  await page.goto('/photography')
  await expect(page.locator('.gallery-track')).toHaveCount(2)
  const positions = () => page.locator('.gallery-track').evaluateAll(elements => elements.map(el => new DOMMatrix(getComputedStyle(el).transform).m41))
  await page.waitForTimeout(700)
  const before = await positions()
  await page.waitForTimeout(350)
  const after = await positions()
  expect(after[0]).toBeLessThan(before[0]); expect(after[1]).toBeGreaterThan(before[1])
  await page.locator('.gallery-viewport').first().hover()
  await page.waitForTimeout(650)
  const paused = await positions()
  await page.waitForTimeout(250)
  expect((await positions())[0]).toEqual(paused[0])
  const viewport = await page.locator('.gallery-viewport').first().boundingBox()
  await page.mouse.move(viewport.x + 600, viewport.y + 80); await page.mouse.down()
  await page.mouse.move(viewport.x + 400, viewport.y + 80, { steps: 8 }); await page.mouse.up()
  expect((await positions())[0]).not.toEqual(paused[0])
  await expect(page).toHaveURL('/photography')
  const photo = page.locator('.gallery-group').first().getByRole('link').nth(2)
  await photo.focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/photography/portraits?image=portrait-03')
  await expect(page.locator('.series-selected img')).toHaveAttribute('src', /portrait-03/)
  await expect(page.locator('.series-page figure')).toHaveCount(12)
  await expect(page.locator('#root')).not.toHaveAttribute('data-transitioning', 'true')
  const sources = await page.locator('.series-page figure img').evaluateAll(images => images.map(image => image.src))
  expect(new Set(sources).size).toBe(12)
  await page.getByRole('link', { name: 'Selected moments →' }).click()
  await expect(page.locator('h1')).toHaveText('Selected moments')
  await expect(page.locator('.series-page figure')).toHaveCount(7)
})

test('project chapters, project notes, contact links and unknown routes work', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.locator('.project-row')).toHaveCount(2)
  await page.locator('.project-row').nth(1).click()
  await expect(page.locator('h1')).toHaveText('A shared workbench')
  await page.getByRole('button', { name: 'Next image' }).click()
  await expect(page.locator('.project-viewer figure img')).toHaveAttribute('src', /material-study/)
  await page.locator('.project-viewer').focus(); await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.project-viewer figure img')).toHaveAttribute('src', /workstation/)
  await page.getByText('Project notes', { exact: false }).click()
  await expect(page.locator('details')).toHaveAttribute('open', '')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.getByRole('link', { name: 'jiaqii7@outlook.com', exact: true })).toHaveAttribute('href', 'mailto:jiaqii7@outlook.com')
  await page.goto('/unknown-page')
  await expect(page.locator('h1')).toHaveText('A little off the map.')
  await page.getByRole('link', { name: 'Back to the workbench' }).click()
  await expect(page).toHaveURL('/')
})

test('mobile navigation, reduced motion and static gallery remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const models = []
  page.on('request', request => { if(request.url().endsWith('.glb')) models.push(request.url()) })
  await page.goto('/')
  await expect(page.locator('.workbench-poster')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.workbench-poster img')).toHaveJSProperty('naturalWidth', 390)
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link')).toHaveCount(5)
  await activate(page, page.locator('[data-anchor="camera"]'))
  await activate(page, page.locator('[data-anchor="camera"]'))
  await expect(page).toHaveURL('/photography')
  await expect(page.locator('.camera-transition')).toHaveCount(0)
  await expect(page.locator('.gallery-group')).toHaveCount(2)
  await expect(page.locator('.gallery-viewport.is-static')).toHaveCount(2)
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  expect(hasOverflow).toBe(false); expect(models).toEqual([])
  await page.screenshot({ path: 'docs/qa/reduced-mobile.png' })
})

test('failed model and unavailable WebGL keep direct navigation available', async ({ browser }) => {
  for (const failure of ['model', 'webgl']) {
    const page = await browser.newPage()
    if (failure === 'model') await page.route('**/*.glb', route => route.abort())
    else await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : getContext.call(this, type, ...args) }
    })
    await page.goto('http://127.0.0.1:4175/')
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'error')
    await expect(page.locator('.workbench-poster')).toBeVisible()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Projects', exact: true }).click()
    await expect(page).toHaveURL('http://127.0.0.1:4175/projects')
    await page.close()
  }
})

test('main pages retain accessibility apart from the explicitly matched reference gray labels', async ({ page }, testInfo) => {
  test.setTimeout(120000)
  for (const mode of ['day', 'night', 'mobile']) {
    await page.setViewportSize({width: mode === 'mobile' ? 390 : 1440, height: mode === 'mobile' ? 844 : 1000})
    for (const path of ['/', '/photography', '/photography/portraits?image=portrait-03', '/projects', '/projects/portfolio', '/about', '/contact']) {
      await page.goto(path)
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, mode === 'night' ? 'night' : 'day')
      await expect(page.locator('h1')).toHaveCount(1)
      // Audit the fully revealed text, rather than an intentionally transparent entry frame.
      await page.evaluate(() => Promise.all([...document.querySelectorAll('.reveal-line,.text-arrival')].flatMap(el => el.getAnimations()).map(animation => animation.finished.catch(() => {}))))
      const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
      // The requested reference uses low-contrast gray for these exact small labels.
      // Record those findings; do not waive other elements or accessibility rules.
      const unexpected = [], referenceContrast = []
      for (const violation of result.violations) for (const node of violation.nodes) {
        const matchedReference = violation.id === 'color-contrast' && await page.locator(node.target.join(' ')).evaluate(el =>
          el.matches('.canvas-nav a,.identity-link>.meta,.canvas-base>.meta,.reference-about-intro>p,.reference-about-meta dt') &&
          ['rgba(11, 11, 10, 0.42)','rgba(11, 11, 10, 0.46)','rgba(11, 11, 10, 0.48)','rgba(11, 11, 10, 0.54)'].includes(getComputedStyle(el).color))
        ;(matchedReference ? referenceContrast : unexpected).push({id:violation.id,target:node.target})
      }
      if(referenceContrast.length) await testInfo.attach(`reference-gray-${mode}-${path.replaceAll('/','_')}`,{body:JSON.stringify(referenceContrast),contentType:'application/json'})
      expect(unexpected, `${mode} ${path}`).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${mode} ${path}: overflow`).toBe(false)
    }
  }
})

test('scene zoom, full orbit and pan leave the page unchanged; Revert restores the initial pose', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  const pose = () => page.locator('.workbench-canvas').evaluate(el => ({ position:el.dataset.cameraPosition.split(',').map(Number), target:el.dataset.cameraTarget.split(',').map(Number), distance:Number(el.dataset.cameraDistance) }))
  const layout = () => page.locator('.identity-name').evaluate(el => ({ width:el.getBoundingClientRect().width, height:el.getBoundingClientRect().height, font:getComputedStyle(el).fontSize, scale:visualViewport.scale, viewport:innerWidth }))
  const original = await pose(), originalLayout = await layout()
  await page.mouse.move(1250, 550)
  await page.keyboard.down('Control'); await page.mouse.wheel(0,-160); await page.keyboard.up('Control')
  await expect.poll(async () => (await pose()).distance).toBeLessThan(original.distance*.95)
  expect(await layout()).toEqual(originalLayout)
  await page.mouse.move(1250,550);await page.mouse.down();await page.mouse.move(550,550,{steps:16});await page.mouse.up()
  const orbited=await pose()
  expect(Math.hypot(...orbited.position.map((v,i)=>v-original.position[i]))).toBeGreaterThan(1)
  await page.mouse.move(1250,550);await page.mouse.down({button:'right'});await page.mouse.move(1100,470,{steps:8});await page.mouse.up({button:'right'})
  await expect.poll(async()=>Math.hypot(...(await pose()).target.map((v,i)=>v-original.target[i]))).toBeGreaterThan(.1)
  await page.getByRole('button',{name:'Revert',exact:true}).click();await ready(page)
  const restored=await pose()
  for(let i=0;i<3;i++){expect(restored.position[i]).toBeCloseTo(original.position[i],4);expect(restored.target[i]).toBeCloseTo(original.target[i],4)}
  expect(restored.distance).toBeCloseTo(original.distance,4)
  expect(await layout()).toEqual(originalLayout)
  await activate(page, page.getByRole('button',{name:'Desk lamp: switch to night mode'}))
  await switchView(page,/Work & ideas/)
  await page.getByRole('button',{name:'Revert',exact:true}).click();await ready(page)
  await expect(page.locator('.home')).toHaveAttribute('data-view','overview')
  await expect(page.locator('html')).toHaveAttribute('data-theme','day')
})

test('CV opens the supplied document, downloads from its lightbox and directly from About', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await activate(page, page.locator('[data-anchor="monitor"]'))
  await activate(page, page.getByRole('button',{name:'Curriculum vitae'}))
  const dialog=page.getByRole('dialog',{name:'Jiaqi Shi · CV'})
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('img')).toHaveJSProperty('naturalHeight',2400)
  const downloadPromise=page.waitForEvent('download')
  await dialog.getByRole('link',{name:'Download my CV'}).click()
  const download=await downloadPromise
  expect(download.suggestedFilename()).toBe('Jiaqi Shi 2026 CV.pdf')
  expect(await download.failure()).toBeNull()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Curriculum vitae'})).toBeFocused()
  await page.goto('/about')
  const direct=page.getByRole('link',{name:'Download my CV'})
  await expect(direct).toHaveAttribute('href','/documents/jiaqi-shi-cv-2026.pdf')
  await expect(direct).toHaveAttribute('download','Jiaqi Shi 2026 CV.pdf')
  const directPromise=page.waitForEvent('download');await direct.click()
  expect((await directPromise).suggestedFilename()).toBe('Jiaqi Shi 2026 CV.pdf')
})
