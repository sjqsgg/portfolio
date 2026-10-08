import { useEffect, useLayoutEffect, useRef } from 'react'
import { createDominoMotion, dominoSettings } from './dominoMotion'

export default function SiteLoader({ ready, onComplete }) {
  const word = useRef(null)
  const completion = useRef({ ready, onComplete })
  useLayoutEffect(() => { completion.current = { ready, onComplete } }, [ready, onComplete])
  useEffect(() => {
    const node = word.current
    const letters = [...node.children]
    const motion = createDominoMotion(letters.length)
    let frame, previous
    const animate = now => {
      if (completion.current.ready) motion.finishAfterCycle()
      // Pause simulation time in background tabs; cap stalls while the model compiles.
      if (previous !== undefined && !document.hidden) motion.advance(Math.min((now - previous) / 1000, 0.05))
      previous = now
      node.dataset.phase = motion.phase
      motion.letters.forEach((letter, index) => {
        letters[index].style.transform = `rotate(${letter.angle}rad)`
        letters[index].style.opacity = 1 - dominoSettings.shade * Math.min(1, Math.abs(letter.angle) / (Math.PI * dominoSettings.lean / 180))
      })
      if (motion.phase === 'finished') {
        completion.current.onComplete()
        return
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <div className="site-loader is-loading" role="status" aria-live="polite" aria-label="Loading the workbench">
    <div className="site-loader-type" aria-hidden="true">
      <span className="site-loader-word" ref={word}>
        {'Loading...'.split('').map((letter, index) => <span className="site-loader-letter" key={index}>{letter}</span>)}
      </span>
    </div>
  </div>
}
