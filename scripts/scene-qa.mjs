import { chromium } from '@playwright/test'
const browser = await chromium.launch({channel:'chrome',headless:true})
const page = await browser.newPage({viewport:{width:1440,height:1000}})
page.on('pageerror', e=>console.error(e.message))
await page.goto('http://127.0.0.1:4176/')
await page.waitForSelector('.workbench-canvas[data-state="ready"]',{timeout:30000})
for (const mode of ['desktop','mobile']) {
 if(mode==='mobile')await page.setViewportSize({width:390,height:844})
 for (const [view,label] of [['overview','The workbench'],['work','Work & ideas'],['photo','Through the lens']]) {
  await page.getByRole('navigation',{name:'Workbench views'}).getByRole('button',{name:new RegExp(label)}).click()
  await page.waitForTimeout(1400)
  await page.screenshot({path:`docs/qa/v2/${view}-${mode}.png`})
  console.log(view,mode,await page.locator('[data-anchor]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.anchor,x:n.dataset.meshX,y:n.dataset.meshY,rect:{x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y}}))))
 }
}
await browser.close()
