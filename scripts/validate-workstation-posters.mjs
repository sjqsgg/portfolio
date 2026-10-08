import { readFile } from 'node:fs/promises'
import { posterSources, digest } from './workstation-poster-sources.mjs'

try {
  const manifest = JSON.parse(await readFile('docs/workstation-posters.json', 'utf8'))
  const sources = await posterSources()
  const changed = Object.keys(sources).filter(file => sources[file] !== manifest.sources[file])
  if (changed.length) throw new Error(`Scene inputs changed: ${changed.join(', ')}`)
  const expected = ['overview-day', 'overview-mobile', 'work-day', 'work-mobile', 'photo-day', 'photo-mobile', 'intro-day', 'intro-mobile', 'cover-day'].map(name => `public/images/workstation/${name}.webp`)
  expected.push('src/portfolio/posterAnchors.css')
  for (const file of expected) {
    if (!manifest.outputs[file] || digest(await readFile(file)) !== manifest.outputs[file].sha256) throw new Error(`Missing or changed generated asset: ${file}`)
  }
  console.log('Workstation posters match the current scene, cameras and default board objects.')
} catch (error) {
  console.error(`${error.message}\nRun npm run posters:generate to refresh the scene images before building.`)
  process.exitCode = 1
}
