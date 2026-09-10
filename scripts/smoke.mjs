import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', error => console.error('PAGE ERROR', error.message))
page.on('console', message => { if(message.type() === 'error') console.error('CONSOLE',message.text()) })
await mkdir('docs/qa', { recursive: true })
await page.goto('http://127.0.0.1:4176/')
await page.waitForSelector('.workbench-canvas[data-state="ready"]', { timeout: 25000 })
await page.waitForTimeout(900)
await page.screenshot({ path: 'docs/qa/home-desktop.png' })
for (const [path, name] of [['/photography','photography-desktop'],['/photography/portraits?image=portrait-03','series-desktop'],['/projects','projects-desktop'],['/projects/shanxi-map','project-desktop'],['/about','about-desktop']]) {
 await page.goto(`http://127.0.0.1:4176${path}`)
 await page.waitForLoadState('networkidle')
 await page.screenshot({path:`docs/qa/${name}.png`})
 console.log(name, await page.locator('h1').innerText(), await page.evaluate(() => ({overflow:document.documentElement.scrollWidth>innerWidth, images:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)})))
}
await page.setViewportSize({width:390,height:844})
for (const [path,name] of [['/','home-mobile'],['/photography','photography-mobile'],['/about','about-mobile']]) {
 await page.goto(`http://127.0.0.1:4176${path}`)
 await page.waitForLoadState('networkidle')
 await page.screenshot({path:`docs/qa/${name}.png`})
 console.log(name, await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth})))
}
await browser.close()
