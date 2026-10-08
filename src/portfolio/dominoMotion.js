// Independently implemented angular simulation; no React Bits source is used.
const radians = degrees => degrees * Math.PI / 180
export const dominoSettings = Object.freeze({
  delay: 0.2, stagger: 0.03, gravity: 1, fallSpeed: 1.6, lean: 58,
  stiffness: 1, damping: 0.55, hold: 1.2, push: 1,
  toppleAt: 30, shade: 0.6, loopDelay: 0.25,
})

export function createDominoMotion(count) {
  const settings = dominoSettings
  const letters = Array.from({ length: count }, () => ({ angle: 0, velocity: 0, phase: 'waiting', pushed: false, startAt: Infinity }))
  let time = 0, phase = 'waiting', deadline = settings.delay, remainder = 0, finishRequested = false
  const lean = radians(settings.lean)
  const push = letter => { letter.phase = 'falling'; letter.velocity = 2 * settings.push * settings.fallSpeed }
  function tick(dt) {
    time += dt
    if (phase === 'waiting' && time >= deadline && letters.length) {
      phase = 'falling'
      push(letters[0])
    }
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]
      if (letter.phase === 'waiting' && time >= letter.startAt) push(letter)
      if (letter.phase === 'falling') {
        letter.velocity += 24 * settings.gravity * settings.fallSpeed ** 2 * Math.sin(letter.angle) * dt
        letter.angle = Math.min(lean, letter.angle + letter.velocity * dt)
        // Contact, rather than an absolute timeline, propagates the impulse.
        if (!letter.pushed && letter.angle >= radians(settings.toppleAt)) {
          letter.pushed = true
          if (letters[i + 1]) letters[i + 1].startAt = time + settings.stagger / settings.fallSpeed
        }
        if (letter.angle === lean) { letter.phase = 'down'; letter.velocity = 0 }
      }
      if (letter.phase === 'rising' && time >= letter.startAt) {
        const stiffness = 170 * settings.stiffness
        const damping = 2 * Math.sqrt(stiffness) * settings.damping
        letter.velocity += (-stiffness * letter.angle - damping * letter.velocity) * dt
        letter.angle += letter.velocity * dt
        if (Math.abs(letter.angle) < 0.0005 && Math.abs(letter.velocity) < 0.005) {
          letter.angle = 0; letter.velocity = 0; letter.phase = 'upright'
        }
      }
    }
    if (phase === 'falling' && letters.every(letter => letter.phase === 'down')) {
      phase = 'holding'; deadline = time + settings.hold
    } else if (phase === 'holding' && time >= deadline) {
      phase = 'rising'
      letters.forEach((letter, index) => { letter.phase = 'rising'; letter.startAt = time + index * settings.stagger })
    } else if (phase === 'rising' && letters.every(letter => letter.phase === 'upright')) {
      phase = finishRequested ? 'finished' : 'resting'; deadline = time + settings.loopDelay
    } else if (phase === 'resting' && time >= deadline) {
      letters.forEach(letter => Object.assign(letter, { angle: 0, velocity: 0, phase: 'waiting', pushed: false, startAt: Infinity }))
      phase = 'waiting'; deadline = time
    }
  }
  return {
    letters,
    finishAfterCycle() {
      finishRequested = true
      if (phase === 'resting') phase = 'finished'
    },
    get phase() { return phase },
    advance(seconds) {
      remainder += seconds
      // A fixed step keeps the spring stable and the chain identical at 30/60/120Hz.
      while (remainder >= 1 / 240) { tick(1 / 240); remainder -= 1 / 240 }
    },
  }
}
