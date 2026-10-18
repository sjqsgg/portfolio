import { test, expect } from '@playwright/test'

const ready = page => expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving','false',{timeout:30000})
async function start(page) { await page.goto('/'); await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state','ready',{timeout:30000}); await ready(page); await expect(page.locator('.site-loader')).toHaveCount(0,{timeout:10000}); await expect(page.locator('.home')).toHaveAttribute('data-entrance','done') }
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
  const screenshot=await page.screenshot()
  const samples=await page.evaluate(async url=>{
    const image=new Image();image.src=url;await image.decode()
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
    return [[.25,.25],[.75,.25],[.25,.65],[.75,.65]].map(([x,y])=>[...ctx.getImageData(Math.floor(x*image.width),Math.floor(y*image.height),1,1).data])
  },`data:image/png;base64,${screenshot.toString('base64')}`)
  for(const rgba of samples) expect(Math.max(...rgba.slice(0,3))).toBeLessThan(235)
  // At the bend, the lower edge must sit lower in the middle than at either side.
  // The current controller holds the dark screen until 420ms; sample the
  // actual rising bend, not the earlier dark hold.
  await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.pseudoElement?.includes('view-transition')).forEach(a=>{a.currentTime=800}))
  await page.screenshot()
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
  await page.screenshot()
  await clickObject(page,'film')
  await expect(page).toHaveURL('/photography')
  await start(page);await clickObject(page,'camera');await ready(page);await clickObject(page,'camera')
  await expect(page).toHaveURL('/photography')
})

test('unfinished felt board is display-only on desktop',async({page})=>{
  await start(page)
  await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-board-model','felt')
  const marker=page.locator('[data-anchor="board"]')
  expect(await marker.evaluate(el=>({tabIndex:el.tabIndex,pointerEvents:getComputedStyle(el).pointerEvents}))).toEqual({tabIndex:-1,pointerEvents:'none'})
  const p=await point(page,'board')
  await page.mouse.move(p.x+8,p.y+7)
  await expect(page.locator('.workbench-canvas canvas')).toHaveAttribute('data-cursor','')
  await page.mouse.click(p.x+8,p.y+7)
  await page.mouse.click(p.x+8,p.y+7)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Open felt board'})).toHaveCount(0)
  await expect(page.locator('.home')).toHaveAttribute('data-view','overview')
})

test.describe('unfinished felt board touch controls',()=>{
test.use({hasTouch:true})
test('unfinished felt board is display-only on mobile and in the static fallback',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await start(page)
  const p=await point(page,'board')
  await page.touchscreen.tap(p.x,p.y)
  await page.touchscreen.tap(p.x,p.y)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.home')).toHaveAttribute('data-view','overview')
  const camera=await point(page,'camera')
  await page.touchscreen.tap(camera.x,camera.y);await ready(page)
  await expect(page.locator('.home')).toHaveAttribute('data-view','photo')
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await expect(page.locator('.workbench-poster')).toBeVisible()
  const box=await page.locator('[data-anchor="board"]').boundingBox()
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Open felt board'})).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
})
})
