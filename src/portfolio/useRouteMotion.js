import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const scrollPositions = new Map()
const visible = el => { const r = el.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight }

// Keep the outgoing React page mounted until the browser has captured it, including WebGL.
export default function useRouteMotion(incoming, reduced) {
  const [displayed, setDisplayed] = useState(incoming)
  const current = useRef(incoming)
  const active = useRef(null)
  useEffect(() => {
    if (incoming.key === current.current.key) return
    active.current?.skipTransition?.()
    document.querySelectorAll('.reveal-line,.text-arrival,.gallery-photo').forEach(el => el.getAnimations().forEach(animation => animation.finish()))
    const previous = current.current
    current.current = incoming
    scrollPositions.set(previous.pathname, window.scrollY)
    const opening = previous.pathname === '/photography' && incoming.pathname.startsWith('/photography/')
    const closing = previous.pathname.startsWith('/photography/') && incoming.pathname === '/photography'
    const kind = opening ? 'photo-open' : closing ? 'photo-close' : 'page'
    const imageId = new URLSearchParams((opening ? incoming : previous).search).get('image')
    let outgoingImage
    if (opening && imageId) outgoingImage = [...document.querySelectorAll(`[data-photo-id="${CSS.escape(imageId)}"] img`)].find(visible)
    else if (closing) outgoingImage = document.querySelector('.series-selected img')
    const shared = outgoingImage && visible(outgoingImage)
    if (shared) outgoingImage.style.viewTransitionName = 'selected-photo'
    const style = document.documentElement.style
    // Percent coordinates resolve against the snapshot itself, avoiding pixel-path
    // mismatches under display or browser scaling.
    const mask = (edge, control) => {
      const shape = `shape(from 0% 0%, line to 100% 0%, line to 100% ${edge}%, curve to 0% ${edge}% with 50% ${control}%, close)`
      if (CSS.supports('clip-path', shape)) return shape
      const curve = Array.from({ length:65 }, (_, i) => {
        const t = i / 64
        return `${100 * (1 - t)}% ${edge + 2 * t * (1 - t) * (control - edge)}%`
      })
      return `polygon(0% 0%,100% 0%,${curve.join(',')})`
    }
    style.setProperty('--route-mask-start', mask(100, 100))
    style.setProperty('--route-mask-bend', mask(60, 100))
    style.setProperty('--route-mask-end', mask(0, 0))
    document.documentElement.dataset.routeMotion = kind
    document.documentElement.dataset.routeEntering = 'true'
    const root = document.getElementById('root')
    let cancelled = false
    let arrival
    const update = () => {
      if (cancelled) return
      flushSync(() => setDisplayed(incoming))
      window.scrollTo({ top: closing ? scrollPositions.get('/photography') || 0 : 0, behavior: 'instant' })
      if (shared) {
        const target = opening ? document.querySelector('.series-selected img') : [...document.querySelectorAll(`[data-photo-id="${CSS.escape(imageId || outgoingImage.dataset.photoId || '')}"] img`)].find(visible)
        if (target) target.style.viewTransitionName = 'selected-photo'
      }
    }
    const finish = () => {
      if (cancelled) return
      // The snapshot lifts onto white first. Reveal the live destination only now,
      // so its paused text and photographs animate where the visitor can see them.
      if (kind === 'page' && !reduced) {
        arrival = root.animate([{ opacity:0 }, { opacity:1 }], { duration:50, easing:'ease-out' })
      }
      delete document.documentElement.dataset.routeMotion
      delete document.documentElement.dataset.routeEntering
      delete root.dataset.transitioning
      root.inert = false
      document.querySelectorAll('[style*="view-transition-name"]').forEach(el => el.style.removeProperty('view-transition-name'))
      document.getElementById('main-content')?.focus({ preventScroll: true })
      active.current = null
    }
    let fallbackTimer
    if (reduced) { update(); finish() }
    else if (document.startViewTransition) {
      root.dataset.transitioning = 'true'
      root.inert = true
      const transition = document.startViewTransition(update)
      active.current = transition
      // Capture can be skipped by the browser (background tabs or a resize); navigation still completes.
      transition.ready.catch(() => {})
      transition.finished.then(finish, finish)
    } else {
      update()
      root.dataset.transitioning = 'fallback'
      fallbackTimer = setTimeout(finish, kind === 'page' ? 1950 : 920)
    }
    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      arrival?.cancel()
      active.current?.skipTransition?.()
      root.inert = false
      delete root.dataset.transitioning
      delete document.documentElement.dataset.routeMotion
      delete document.documentElement.dataset.routeEntering
      document.querySelectorAll('[style*="view-transition-name"]').forEach(el => el.style.removeProperty('view-transition-name'))
    }
  }, [incoming, reduced])
  return displayed
}
