import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ready = page => expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving','false',{timeout:30000})
async function start(page) { await page.goto('/'); await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state','ready',{timeout:30000}); await ready(page) }
async function point(page, id) { return page.locator(`[data-anchor="${id}"]`).evaluate(el => ({x:Number(el.dataset.meshX),y:Number(el.dataset.meshY)})) }
async function clickObject(page,id) { const p=await point(page,id); await page.mouse.click(p.x,p.y) }

for (const scale of [1,2,3]) test(`page wipe covers the entire viewport at pixel density ${scale}`, async ({browser}) => {
  const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:scale})
  const page=await context.newPage()
  if(scale===3) await page.addInitScript(()=>{ const supports=CSS.supports.bind(CSS); CSS.supports=(...args)=>args[0]==='clip-path' && args[1]?.startsWith('shape(') ? false : supports(...args) })
  await page.goto('http://127.0.0.1:4175/about')
  if(scale===2) await page.evaluate(()=>{ document.documentElement.style.zoom='1.25' })
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Contact',exact:true}).click()
  await expect(page.locator('html')).toHaveAttribute('data-route-motion','page')
  await page.waitForFunction(()=>document.getAnimations().some(a=>a.effect?.pseudoElement==='::view-transition-old(root)'))
  const clip=await page.evaluate(()=>{
    document.getAnimations().filter(a=>a.effect?.pseudoElement?.includes('view-transition')).forEach(a=>{ a.pause();a.currentTime=200 })
    return getComputedStyle(document.documentElement,'::view-transition-old(root)').clipPath
  })
  expect(clip).not.toContain('path(')
  const screenshot=await page.screenshot({path:`docs/qa/scene-round/wipe-dpr-${scale}.png`})
  const samples=await page.evaluate(async url=>{
    const image=new Image();image.src=url;await image.decode()
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
    return [[.25,.25],[.75,.25],[.25,.65],[.75,.65]].map(([x,y])=>[...ctx.getImageData(Math.floor(x*image.width),Math.floor(y*image.height),1,1).data])
  },`data:image/png;base64,${screenshot.toString('base64')}`)
  for(const rgba of samples) expect(Math.max(...rgba.slice(0,3))).toBeLessThan(235)
  // At the bend, the lower edge must sit lower in the middle than at either side.
  await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.pseudoElement?.includes('view-transition')).forEach(a=>{a.currentTime=650}))
  await page.screenshot({path:`docs/qa/scene-round/concave-dpr-${scale}.png`})
  const boundary=await page.evaluate(()=>{
    const clip=getComputedStyle(document.documentElement,'::view-transition-old(root)').clipPath
    const shape=clip.match(/line to 100% ([-+\de.]+)px, curve to 0% [-+\de.]+px with 50% ([-+\de.]+)px/)
    if(shape) {
      const edge=Number(shape[1]);const control=Number(shape[2])
      return {left:edge,middle:edge+(control-edge)/2,right:edge,height:innerHeight}
    }
    const points=clip.slice(clip.indexOf('(')+1,-1).split(',').map(point=>Number(point.trim().split(/\s+/).at(-1).replace(/[^-+\de.]/g,'')))
    const curve=points.slice(2)
    return {left:curve.at(-1),middle:curve[Math.floor((curve.length-1)/2)],right:curve[0],height:innerHeight}
  })
  expect(boundary.middle).toBeGreaterThan(boundary.left+boundary.height*.1)
  expect(boundary.middle).toBeGreaterThan(boundary.right+boundary.height*.1)
  await context.close()
})

test('all photography objects approach first, and both camera bodies open Photography only in the close view',async({page})=>{
  test.setTimeout(90000)
  await start(page)
  for(const id of ['camera','film','lens','mug','guestbook','audio']) {
    await page.getByRole('button',{name:'Revert',exact:true}).click();await ready(page)
    await clickObject(page,id)
    await expect(page.locator('.home')).toHaveAttribute('data-view','photo')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await ready(page)
  }
  const camera=await page.locator('.workbench-canvas').evaluate(el=>({p:el.dataset.cameraPosition.split(',').map(Number),t:el.dataset.cameraTarget.split(',').map(Number)}))
  expect(Math.atan2(camera.p[1]-camera.t[1],Math.hypot(camera.p[0]-camera.t[0],camera.p[2]-camera.t[2]))*180/Math.PI).toBeLessThan(15)
  await page.mouse.move(1500,800)
  await page.screenshot({path:'docs/qa/scene-round/photo-final-desktop.png'})
  await clickObject(page,'film')
  await expect(page).toHaveURL('/photography')
  await start(page);await clickObject(page,'camera');await ready(page);await clickObject(page,'camera')
  await expect(page).toHaveURL('/photography')
})

test('board opens from its surface with margins and closes outside or with Escape',async({page})=>{
  await start(page)
  const p=await point(page,'board')
  await page.mouse.click(p.x+8,p.y+7)
  const dialog=page.getByRole('dialog',{name:'Pegboard',exact:true})
  await expect(dialog).toBeVisible()
  await expect(page.locator('.pegboard-canvas')).toHaveAttribute('data-state','ready',{timeout:15000})
  await page.waitForTimeout(900)
  const box=await dialog.boundingBox()
  expect(box.x).toBeGreaterThan(30);expect(box.y).toBeGreaterThan(30)
  const surface=await page.locator('.pegboard-panel').evaluate(el=>{const css=getComputedStyle(el);return {background:css.backgroundColor,border:css.borderWidth,radius:css.borderRadius,shadow:css.boxShadow}})
  expect(surface).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px',radius:'0px',shadow:'none'})
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2)
  await expect(dialog).toBeVisible()
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(audit.violations).toEqual([])
  await page.screenshot({path:'docs/qa/scene-round/board-final-desktop.png'})
  await page.mouse.click(10,400);await expect(dialog).toHaveCount(0)
  await page.locator('[data-anchor="board"]').focus();await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0)
  await expect(page.locator('[data-anchor="board"]')).toBeFocused()
  await page.keyboard.press('Enter');await expect(page.locator('.pegboard-canvas')).toHaveAttribute('data-state','ready')
  await page.waitForTimeout(850)
  const transparent=await dialog.boundingBox()
  await page.mouse.click(transparent.x+2,transparent.y+transparent.height/2)
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.scene-views,.object-labels,.scene-return,.scene-instruction')).toHaveCount(0)
})

test('mobile close view and board keep a usable frame without visible scene labels',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await start(page);await clickObject(page,'camera');await ready(page)
  await page.screenshot({path:'docs/qa/scene-round/photo-final-mobile.png'})
  await page.locator('[data-anchor="board"]').focus();await page.keyboard.press('Enter')
  const dialog=page.getByRole('dialog',{name:'Pegboard',exact:true})
  await expect(dialog).toBeVisible();await expect(page.locator('.pegboard-canvas')).toHaveAttribute('data-state','ready')
  await page.waitForTimeout(900)
  const box=await dialog.boundingBox()
  expect(box.x).toBeGreaterThan(12);expect(box.y).toBeGreaterThan(32);expect(box.width).toBeLessThan(390)
  await page.screenshot({path:'docs/qa/scene-round/board-final-mobile.png'})
  await page.mouse.click(5,422);await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
})
