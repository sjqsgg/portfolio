import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { series, orderedPhotos } from '../src/data/series.js'
import { projects } from '../src/data/projects.js'

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
