import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { prepareRouteTransition, routeTransitionDuration } from './routeTransition'

const scrollPositions = new Map()
const visible = el => { const r = el.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight }

// Keep the outgoing React page mounted until the browser has captured it, including WebGL.
export default function useRouteMotion(incoming, reduced) {
  const [displayed, setDisplayed] = useState(incoming)
  const current = useRef(incoming)
  const active = useRef(null)
  useLayoutEffect(() => {
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
    const clearTransition = prepareRouteTransition(kind)
    const root = document.getElementById('root')
    let cancelled = false
    const update = () => {
      if (cancelled) return
      flushSync(() => setDisplayed(incoming))
      document.getElementById('main-content')?.setAttribute('data-route-arrived', '')
      window.scrollTo({ top: closing ? scrollPositions.get('/photography') || 0 : 0, behavior: 'instant' })
      if (shared) {
        const target = opening ? document.querySelector('.series-selected img') : [...document.querySelectorAll(`[data-photo-id="${CSS.escape(imageId || outgoingImage.dataset.photoId || '')}"] img`)].find(visible)
        if (target) target.style.viewTransitionName = 'selected-photo'
      }
    }
    const finish = () => {
      if (cancelled) return
      clearTransition()
      delete root.dataset.transitioning
      root.inert = false
      outgoingImage?.style.removeProperty('view-transition-name')
      document.querySelector('.series-selected img')?.style.removeProperty('view-transition-name')
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
      fallbackTimer = setTimeout(finish, kind === 'page' ? routeTransitionDuration() : 920)
    }
    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      active.current?.skipTransition?.()
      root.inert = false
      delete root.dataset.transitioning
      clearTransition()
      outgoingImage?.style.removeProperty('view-transition-name')
    }
  }, [incoming, reduced])
  return displayed
}
