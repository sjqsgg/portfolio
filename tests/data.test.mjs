import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { series, orderedPhotos } from '../src/data/series.js'
import { projects } from '../src/data/projects.js'
import workstationCurrent from '../docs/workstation-current.json' with { type: 'json' }

test('every gallery entry opens a complete series with the selected photograph first', () => {
  for (const collection of series) for (const selected of collection.photos) {
    const ordered = orderedPhotos(collection.photos, selected.id)
    assert.equal(ordered[0].id, selected.id)
    assert.deepEqual(new Set(ordered.map(photo => photo.id)), new Set(collection.photos.map(photo => photo.id)))
    assert.equal(ordered.length, collection.photos.length)
  }
  assert.deepEqual(orderedPhotos(series[0].photos, 'missing'), series[0].photos)
})
test('every published image and derivative exists locally', () => {
  for (const collection of series) for (const photo of collection.photos) {
    const assets = [photo.original, photo.src, ...photo.srcSet.split(', ').map(value => value.split(' ')[0])]
    for (const asset of assets) assert.ok(existsSync(`public${asset}`), asset)
    assert.ok(photo.alt && photo.width > 0 && photo.height > 0)
  }
  for (const project of projects) for (const chapter of project.chapters) assert.ok(existsSync(`public${chapter.image}`), chapter.image)
})

test('the workstation has one current production baseline with a felt board', () => {
  assert.equal(workstationCurrent.status, 'current')
  assert.equal(workstationCurrent.source, 'jiaqii7.com production baseline')
  assert.ok(Object.keys(workstationCurrent.parts).length > 0)
  assert.ok(Object.keys(workstationCurrent.materials).length > 0)
  assert.match(workstationCurrent.board.frameColor, /^[0-9a-f]{6}$/i)
  assert.match(workstationCurrent.board.feltColor, /^[0-9a-f]{6}$/i)
  assert.equal('Board_frame_preview' in workstationCurrent.materials, false)
  assert.equal('Board_felt_preview' in workstationCurrent.materials, false)
  assert.equal('Sage_pegboard' in workstationCurrent.materials, false)
  const workbench = readFileSync('src/portfolio/Workbench.jsx', 'utf8')
  const controls = readFileSync('src/portfolio/LookdevPanel.jsx', 'utf8')
  assert.match(workbench, /workstation-current\.json/)
  assert.doesNotMatch(workbench, /workstation-lookdev-round-/)
  assert.doesNotMatch(controls, /workstation-lookdev-round-|Checkpoint 01|Round 02|Round 04/)
})
