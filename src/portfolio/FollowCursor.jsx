import { useEffect, useRef } from 'react'
import { animate, useMotionValue, motion as Motion, useReducedMotion } from 'motion/react'

export default function FollowCursor() {
  const node = useRef(null), label = useRef(null)
  const x = useMotionValue(-300), y = useMotionValue(-300)
  const reduced = useReducedMotion()
  useEffect(() => {
    const media = matchMedia('(hover: hover) and (pointer: fine)')
    if (reduced || !media.matches) return
    let target = null, ax, ay
    const hide = () => { target = null; node.current?.removeAttribute('data-visible') }
    function move(event) {
      const el = event.target.closest?.('[data-cursor]')
      const text = el?.dataset.cursor
      if (!text || event.buttons || document.querySelector('dialog[open]') || document.getElementById('root').dataset.transitioning) { hide(); return }
      if (target !== el || label.current.textContent !== text) {
        target = el; label.current.textContent = text
        node.current.dataset.visible = 'true'
      }
      const width = node.current.offsetWidth
      ax?.stop(); ay?.stop()
      ax = animate(x, Math.max(8, Math.min(event.clientX + 18, innerWidth - width - 8)), { duration: .42, ease: [0.22, 1, 0.36, 1] })
      ay = animate(y, Math.max(8, Math.min(event.clientY + 18, innerHeight - 42)), { duration: .42, ease: [0.22, 1, 0.36, 1] })
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerdown', hide)
    document.addEventListener('scroll', hide, true)
    document.documentElement.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    media.addEventListener('change', hide)
    return () => {
      ax?.stop(); ay?.stop()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerdown', hide)
      document.removeEventListener('scroll', hide, true)
      document.documentElement.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
      media.removeEventListener('change', hide)
    }
  }, [reduced, x, y])
  return <Motion.div ref={node} className="follow-cursor" aria-hidden="true" style={{ x, y }}><span ref={label} /><span>↗</span></Motion.div>
}
