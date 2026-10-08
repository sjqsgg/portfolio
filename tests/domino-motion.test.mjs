import test from 'node:test'
import assert from 'node:assert/strict'
import { createDominoMotion, dominoSettings } from '../src/portfolio/dominoMotion.js'

test('contact propagates in order, holds, springs past upright and repeats', () => {
  const motion = createDominoMotion(10)
  const started = new Set()
  let holdStart, riseStart, overshot = false, rested = false, repeated = false
  for (let step = 0; step < 240 * 20; step++) {
    const before = motion.phase
    motion.advance(1 / 240)
    motion.letters.forEach((letter, i) => {
      if (letter.phase === 'falling' && !started.has(i)) {
        if (i) assert.ok(motion.letters[i - 1].angle >= dominoSettings.toppleAt * Math.PI / 180)
        started.add(i)
      }
      assert.ok(letter.angle <= dominoSettings.lean * Math.PI / 180)
      if (letter.angle < -0.02) overshot = true
    })
    if (motion.phase === 'holding' && holdStart === undefined) holdStart = step / 240
    if (motion.phase === 'rising' && riseStart === undefined) riseStart = step / 240
    if (motion.phase === 'resting') rested = true
    if (rested && before === 'waiting' && motion.phase === 'falling') repeated = true
  }
  assert.equal(started.size, 10)
  assert.ok(riseStart - holdStart >= dominoSettings.hold - 1 / 240)
  assert.ok(overshot)
  assert.ok(rested)
  assert.ok(repeated)
})

test('simulation is independent of display refresh rate', () => {
  const angles = [30, 60, 120].map(fps => {
    const motion = createDominoMotion(10)
    for (let frame = 0; frame < fps * 4; frame++) motion.advance(1 / fps)
    return motion.letters.map(letter => letter.angle)
  })
  angles[0].forEach((angle, i) => {
    assert.ok(Math.abs(angle - angles[1][i]) < 1e-10)
    assert.ok(Math.abs(angle - angles[2][i]) < 1e-10)
  })
})

for (const target of ['waiting', 'falling', 'holding', 'rising', 'resting']) {
  test(`readiness during ${target} finishes upright without starting another cycle`, () => {
    const motion = createDominoMotion(10)
    for (let i = 0; motion.phase !== target && i < 2400; i++) motion.advance(1 / 240)
    assert.equal(motion.phase, target)
    motion.finishAfterCycle()
    if (target !== 'resting') assert.notEqual(motion.phase, 'finished')
    for (let i = 0; motion.phase !== 'finished' && i < 2400; i++) motion.advance(1 / 240)
    assert.equal(motion.phase, 'finished')
    assert.ok(motion.letters.every(letter => letter.angle === 0 && letter.velocity === 0))
    motion.advance(10)
    assert.equal(motion.phase, 'finished')
  })
}

test('another fall follows the upright rest within half a second', () => {
  const motion = createDominoMotion(10)
  for (let i = 0; motion.phase !== 'resting' && i < 2400; i++) motion.advance(1 / 240)
  assert.equal(motion.phase, 'resting')
  motion.advance(0.3)
  assert.equal(motion.phase, 'falling')
})
