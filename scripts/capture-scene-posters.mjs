import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:4176/')
await page.waitForSelector('.workbench-canvas[data-state="ready"]', { timeout: 30000 })
let css = '/* Generated from the preset live cameras by capture-scene-posters.mjs. */\n'
for (const mobile of [false, true]) {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 })
  if (mobile) css += '@media (max-width:767px) {\n'
  for (const view of ['overview','work','photo']) {
    if (view === 'overview') await page.getByRole('button',{name:'Revert',exact:true}).click()
    else { await page.locator(`[data-anchor="${view === 'work' ? 'monitor' : 'camera'}"]`).focus(); await page.keyboard.press('Enter') }
    await page.waitForFunction(() => document.querySelector('.workbench-canvas').dataset.moving === 'false')
    await page.waitForTimeout(150)
    const anchors = await page.locator('[data-anchor]').evaluateAll(nodes => nodes.map(node => {
      const home = node.closest('.home')
      return { id: node.dataset.anchor, x: parseFloat(node.style.getPropertyValue('--anchor-x'))/home.clientWidth*100, y: parseFloat(node.style.getPropertyValue('--anchor-y'))/home.clientHeight*100, width: parseFloat(node.style.getPropertyValue('--anchor-width'))/home.clientWidth*100, height: parseFloat(node.style.getPropertyValue('--anchor-height'))/home.clientHeight*100 }
    }))
    for (const a of anchors) css += `.view-${view} .fallback-labels [data-anchor="${a.id}"] { --anchor-x:${a.x.toFixed(3)}%;--anchor-y:${a.y.toFixed(3)}%;--anchor-width:${a.width.toFixed(3)}%;--anchor-height:${a.height.toFixed(3)}%; }\n`
    const style = await page.addStyleTag({ content: '.canvas-identity,.canvas-base,.canvas-revert,.scene-hotspots { visibility:hidden !important; }' })
    await page.locator('.workbench-canvas').screenshot({ path: `docs/qa/v2/${view}-${mobile ? 'mobile' : 'day'}-poster.png` })
    await style.evaluate(node => node.remove())
  }
  if (mobile) css += '}\n'
}
await writeFile('src/portfolio/posterAnchors.css', css)
await browser.close()
