import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { prepareRouteTransition, routeTransitionDuration } from './routeTransition'

export default function useEntranceMotion(pathname, ready, reduced) {
  const [phase, setPhase] = useState(pathname === '/' ? 'loading' : 'done')
  const started = useRef(pathname !== '/')

  useLayoutEffect(() => {
    if (pathname !== '/' || reduced) { started.current = true; setPhase('done'); return }
    if (!ready || started.current) return
    started.current = true
    const root = document.getElementById('root')
    const clearTransition = prepareRouteTransition('page')
    let cancelled = false, released = false, transition, timer
    const reveal = () => {
      if (cancelled) return
      flushSync(() => setPhase('revealing'))
    }
    const release = () => {
      if (released) return
      released = true
      clearTransition()
      delete root.dataset.transitioning
      root.inert = false
    }
    const finish = () => {
      if (cancelled) return
      release()
      setPhase('done')
    }
    root.inert = true
    if (document.startViewTransition) {
      root.dataset.transitioning = 'true'
      try {
        transition = document.startViewTransition(reveal)
        transition.ready.catch(() => {})
        transition.finished.then(finish, finish)
      } catch {
        finish()
      }
    } else {
      // Match the existing route fallback when snapshot transitions are absent.
      root.dataset.transitioning = 'fallback'
      setPhase('revealing')
      timer = window.setTimeout(finish, routeTransitionDuration())
    }
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      transition?.skipTransition()
      release()
    }
  }, [pathname, ready, reduced])

  return phase
}
