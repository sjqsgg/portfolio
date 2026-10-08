import { chromium, expect } from '@playwright/test'
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { posterSources, digest } from './workstation-poster-sources.mjs'

// Own the preview server and a fresh context: no stale build or saved layout
// can leak into the published scene derivatives.
const before = await posterSources()
const baseline = JSON.parse(await readFile('docs/workstation-current.json', 'utf8'))
const server = await createServer({ server: { host: '127.0.0.1', port: 5192, strictPort: true }, logLevel: 'error' })
await server.listen()
let browser
const outputs = new Map()
let css = '/* Generated together with the current scene posters. Run npm run posters:generate. */\n'
try {
  browser = await chromium.launch({ headless: true })
  async function sceneReady(page) {
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-state', 'ready', { timeout: 30000 })
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-workstation-baseline', baseline.checkpoint)
  }
  async function settled(page) {
    await expect(page.locator('.site-loader')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.workbench-canvas')).toHaveAttribute('data-moving', 'false', { timeout: 10000 })
  }
  async function capture(page, name) {
    const style = await page.addStyleTag({ content: '.canvas-identity,.canvas-base,.canvas-revert,.scene-hotspots,.site-loader,.follow-cursor { visibility:hidden !important; }' })
    const png = await page.locator('.workbench-canvas').screenshot({ animations: 'disabled' })
    await style.evaluate(node => node.remove())
    const encoded = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      canvas.getContext('2d').drawImage(image, 0, 0)
      return canvas.toDataURL('image/webp', .9).split(',')[1]
    }, png.toString('base64'))
    outputs.set(`public/images/workstation/${name}.webp`, Buffer.from(encoded, 'base64'))
    console.log(`Captured ${name}`)
  }
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
    const variant = mobile ? 'mobile' : 'day'
    await page.goto('http://127.0.0.1:5192/')
    await sceneReady(page)
    await settled(page)
    if (mobile) css += '@media (max-width:767px) {\n'
    for (const view of ['overview', 'work', 'photo']) {
      if (view !== 'overview') {
        await page.locator(`[data-anchor="${view === 'work' ? 'monitor' : 'camera'}"]`).focus()
        await page.keyboard.press('Enter')
      }
      await expect(page.locator('.immersive-home')).toHaveAttribute('data-view', view)
      await settled(page)
      const anchors = await page.locator('[data-anchor]').evaluateAll(nodes => nodes.map(node => {
        const home = node.closest('.home')
        return { id: node.dataset.anchor, x: parseFloat(node.style.getPropertyValue('--anchor-x')) / home.clientWidth * 100, y: parseFloat(node.style.getPropertyValue('--anchor-y')) / home.clientHeight * 100, width: parseFloat(node.style.getPropertyValue('--anchor-width')) / home.clientWidth * 100, height: parseFloat(node.style.getPropertyValue('--anchor-height')) / home.clientHeight * 100 }
      }))
      for (const anchor of anchors) {
        if (Object.values(anchor).some(value => typeof value === 'number' && !Number.isFinite(value))) throw new Error(`Missing live projection for ${view}/${anchor.id}`)
        const aspect = mobile ? 390 / 844 : 1440 / 1000
        css += `.view-${view} .fallback-labels [data-anchor="${anchor.id}"] { --anchor-x:calc(50% + ${((anchor.x - 50) * aspect).toFixed(3)}svh);--anchor-y:${anchor.y.toFixed(3)}%;--anchor-width:max(32px,${(anchor.width * aspect).toFixed(3)}svh);--anchor-height:max(32px,${anchor.height.toFixed(3)}svh); }\n`
      }
      await capture(page, `${view}-${variant}`)
    }
    if (mobile) css += '}\n'
    if (!mobile) {
      await page.getByRole('button', { name: 'Revert', exact: true }).click()
      await settled(page)
      const normalDistance = Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))
      await page.locator('.workbench-canvas').hover()
      for (let step = 0; step < 20; step++) {
        const distance = Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))
        if (distance >= normalDistance * 1.6) break
        await page.mouse.wheel(0, 100)
        await expect.poll(async () => Number(await page.locator('.workbench-canvas').getAttribute('data-camera-distance'))).toBeGreaterThan(distance)
      }
      await capture(page, 'cover-day')
    }
    await page.close()
  }
  if (JSON.stringify(before) !== JSON.stringify(await posterSources())) throw new Error('Scene sources changed during capture. Re-run before publishing.')
  outputs.set('src/portfolio/posterAnchors.css', Buffer.from(css))
  const manifest = { version: 1, checkpoint: baseline.checkpoint, generatedAt: new Date().toISOString(), sources: before, outputs: Object.fromEntries([...outputs].map(([file, bytes]) => [file, { bytes: bytes.length, sha256: digest(bytes) }])) }
  for (const [file, bytes] of outputs) await writeFile(file, bytes)
  await writeFile('docs/workstation-posters.json', `${JSON.stringify(manifest, null, 2)}\n`)
  console.log('Published seven current WebP images, matching hotspots and source fingerprints.')
} finally {
  await browser?.close()
  await server.close()
}
