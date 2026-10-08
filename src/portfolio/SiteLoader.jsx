import { useEffect, useLayoutEffect, useRef } from 'react'
import { createDominoMotion, dominoSettings, dominoDisplayAngle } from './dominoMotion'

export default function SiteLoader({ ready, onComplete }) {
  const word = useRef(null)
  const completion = useRef({ ready, onComplete })
  useLayoutEffect(() => { completion.current = { ready, onComplete } }, [ready, onComplete])
  useEffect(() => {
    const node = word.current
    const letters = [...node.children]
    const motion = createDominoMotion(letters.length)
    // Measure glyph feet, not the line box: L should rock on its visible bottom corners.
    const context = document.createElement('canvas').getContext('2d')
    const measureSupports = () => letters.forEach(letter => {
      const style = getComputedStyle(letter)
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const metrics = context.measureText(letter.textContent)
      const size = Number.parseFloat(style.fontSize)
      const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8
      const descent = metrics.fontBoundingBoxDescent ?? size * 0.2
      const baseline = (Number.parseFloat(style.lineHeight) - ascent - descent) / 2 + ascent
      letter.style.setProperty('--letter-left', `${-metrics.actualBoundingBoxLeft}px`)
      letter.style.setProperty('--letter-right', `${metrics.actualBoundingBoxRight}px`)
      letter.style.setProperty('--letter-baseline', `${baseline + Math.max(0, metrics.actualBoundingBoxDescent)}px`)
    })
    measureSupports()
    const resize = new ResizeObserver(measureSupports)
    resize.observe(node)
    let frame, previous
    const animate = now => {
      if (completion.current.ready) motion.finishAfterCycle()
      // Pause simulation time in background tabs; cap stalls while the model compiles.
      if (previous !== undefined && !document.hidden) motion.advance(Math.min((now - previous) / 1000, 0.05))
      previous = now
      node.dataset.phase = motion.phase
      motion.letters.forEach((letter, index) => {
        const angle = dominoDisplayAngle(letter.angle)
        // At contact (zero angle) the pose is identical for either support.
        // Crossing upright transfers support to the other foot, keeping both above ground.
        letters[index].style.transformOrigin = `${angle < 0 ? 'var(--letter-left)' : 'var(--letter-right)'} var(--letter-baseline)`
        letters[index].style.transform = `rotate(${angle}rad)`
        letters[index].style.opacity = 1 - dominoSettings.shade * Math.min(1, Math.abs(letter.angle) / (Math.PI * dominoSettings.lean / 180))
      })
      if (motion.phase === 'finished') {
        completion.current.onComplete()
        return
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(frame); resize.disconnect() }
  }, [])
  return <div className="site-loader is-loading" role="status" aria-live="polite" aria-label="Loading the workbench">
    <div className="site-loader-type" aria-hidden="true">
      <span className="site-loader-word" ref={word}>
        {'Loading...'.split('').map((letter, index) => <span className="site-loader-letter" key={index}>{letter}</span>)}
      </span>
    </div>
  </div>
}
