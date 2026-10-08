import test from 'node:test'
import assert from 'node:assert/strict'
import { createDominoMotion, dominoSettings, dominoDisplayAngle } from '../src/portfolio/dominoMotion.js'

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

test('each letter rebounds separately and the full return matches the fall duration', () => {
  const motion = createDominoMotion(10)
  const phases = {}, crossings = [], minima = Array(10).fill(0)
  for (let step = 0; step < 2400 && motion.phase !== 'resting'; step++) {
    motion.advance(1 / 240)
    const time = (step + 1) / 240
    phases[motion.phase] ??= time
    motion.letters.forEach((letter, index) => {
      if (letter.angle < 0) crossings[index] ??= time
      minima[index] = Math.min(minima[index], letter.angle * 180 / Math.PI)
    })
  }
  const fall = phases.holding - phases.falling
  const rise = phases.resting - phases.rising
  assert.ok(Math.abs(fall - rise) < 0.05, `fall ${fall}s, rise ${rise}s`)
  assert.equal(crossings.length, 10)
  crossings.slice(1).forEach((time, index) => assert.ok(time - crossings[index] > 0.1))
  minima.forEach(angle => assert.ok(angle < -2 && angle > -5, `rebound ${angle} degrees`))
})


test('display gain enlarges only the rebound without altering the simulated movement', () => {
  for (const angle of [0, 0.1, 0.5, 1]) assert.equal(dominoDisplayAngle(angle), angle)
  const rebound = -3.621975 * Math.PI / 180
  assert.ok(Math.abs(dominoDisplayAngle(rebound) * 180 / Math.PI + 10) < 0.001)
  // Smoothly join the unchanged incoming movement at upright.
  assert.ok(Math.abs(dominoDisplayAngle(-1e-6) / -1e-6 - 1) < 1e-6)
})
