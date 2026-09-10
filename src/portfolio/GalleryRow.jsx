import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Photo from './Photo'
import { galleryPositions } from './galleryMemory'

export default function GalleryRow({ series, reverse = false, reduced }) {
  const viewport = useRef(null), track = useRef(null)
  const control = useRef({ offset: galleryPositions.get(series.id) || 0, width: 0, hover: false, focus: false, down: null, dragged: false, speed: 0, target: 0, inertia: 0, stopped: false })
  useEffect(() => {
    if (reduced) {
      const element = viewport.current, key = `${series.id}:static`
      element.scrollLeft = galleryPositions.get(key) || 0
      const remember = () => galleryPositions.set(key, element.scrollLeft)
      element.addEventListener('scroll', remember, { passive:true })
      return () => element.removeEventListener('scroll', remember)
    }
    const state = control.current, trackElement = track.current, viewportElement = viewport.current
    let frame, previous = 0, rampStart = 0, rampFrom = 0
    const started = performance.now()
    const paint = () => { trackElement.style.transform = `translate3d(${-state.offset}px,0,0)`; trackElement.dataset.offset = String(state.offset) }
    const measure = () => { state.width = trackElement.firstElementChild.getBoundingClientRect().width; state.offset %= state.width || 1; paint() }
    const observer = new ResizeObserver(measure)
    observer.observe(trackElement.firstElementChild); measure()
    function tick(now) {
      const dt = previous ? Math.min(now - previous, 50) / 1000 : 0
      previous = now
      const navigating = document.documentElement.dataset.routeMotion
      const target = document.hidden || navigating || state.stopped || state.hover || state.focus || state.down || now - started < 480 ? 0 : 30
      if (target !== state.target) { rampStart = now; rampFrom = state.speed; state.target = target }
      const progress = Math.min(1, (now - rampStart) / (target ? 860 : 580))
      state.speed = rampFrom + (target - rampFrom) * (1 - Math.pow(1 - progress, target ? 3 : 4))
      if (!document.hidden && !navigating && !state.down && state.width) {
        state.offset = ((state.offset + ((reverse ? -1 : 1) * state.speed + state.inertia) * dt) % state.width + state.width) % state.width
        state.inertia *= Math.pow(.018, dt)
        if (Math.abs(state.inertia) < .1) state.inertia = 0
        paint()
      }
      frame = requestAnimationFrame(tick)
    }
    function wheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      state.inertia = Math.max(-2800, Math.min(2800, event.deltaX * (event.deltaMode === 1 ? 16 : 1) * 12))
    }
    viewportElement.addEventListener('wheel', wheel, { passive: false })
    frame = requestAnimationFrame(tick)
    return () => { galleryPositions.set(series.id, state.offset); cancelAnimationFrame(frame); observer.disconnect(); viewportElement.removeEventListener('wheel', wheel); trackElement.style.transform = '' }
  }, [reduced, reverse, series.id])
  function onMove(event) {
    const state = control.current
    if (!state.down || reduced) return
    const distance = state.down.x - event.clientX
    if (Math.abs(distance) > 6) { state.dragged = true; viewport.current.setPointerCapture(event.pointerId) }
    if (state.dragged && state.width) {
      const now = performance.now(), dt = Math.max(8, now - state.down.time)
      state.inertia = Math.max(-2800, Math.min(2800, (state.down.lastX - event.clientX) / dt * 1000))
      state.down.lastX = event.clientX; state.down.time = now
      state.offset = ((state.down.offset + distance) % state.width + state.width) % state.width
      track.current.style.transform = `translate3d(${-state.offset}px,0,0)`
    }
  }
  function release(event) {
    const state = control.current
    if (!state.down || !state.dragged || performance.now() - state.down.time > 100) state.inertia = 0
    state.down = null
    if (viewport.current.hasPointerCapture(event.pointerId)) viewport.current.releasePointerCapture(event.pointerId)
  }
  return <section className="gallery-row" aria-label={`${series.title} photographs`}>
    <div className="gallery-row-heading"><h2>{series.title}</h2></div>
    <div ref={viewport} className={`gallery-viewport ${reduced ? 'is-static' : ''}`} tabIndex={0} role="group" aria-label={`${series.title}. Use arrow keys to explore; Space to stop or resume motion.`}
      onKeyDown={event => {
        const state = control.current
        if (event.key === ' ' && event.target === event.currentTarget) { event.preventDefault(); state.stopped = !state.stopped }
        if (!reduced && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); state.inertia = event.key === 'ArrowLeft' ? -650 : 650 }
      }}
      onMouseEnter={() => { control.current.hover = true }} onMouseLeave={() => { control.current.hover = false }}
      onFocusCapture={event => {
        if (!event.target.matches(':focus-visible')) return
        control.current.focus = true
        if (!reduced && event.target.tagName === 'A') {
          control.current.offset = Math.max(0, event.target.offsetLeft - (viewport.current.clientWidth - event.target.clientWidth) / 2)
          track.current.style.transform = `translate3d(${-control.current.offset}px,0,0)`
        }
      }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) control.current.focus = false }}
      onPointerDown={event => {
        if (event.button !== 0 || event.isPrimary === false) return
        control.current.dragged = false; control.current.focus = false; control.current.speed = 0; control.current.inertia = 0
        control.current.down = { x: event.clientX, offset: control.current.offset, lastX: event.clientX, time: performance.now() }
      }}
      onPointerMove={onMove} onPointerUp={release} onPointerCancel={release}
      onClickCapture={event => { if (reduced) galleryPositions.set(`${series.id}:static`, viewport.current.scrollLeft); if (control.current.dragged) { event.preventDefault(); event.stopPropagation(); control.current.dragged = false } }}>
      <div ref={track} className="gallery-track">{[0, ...(reduced ? [] : [1])].map(copy => <div className="gallery-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {series.photos.map((photo, index) => <Link className={`gallery-photo size-${index % 4}`} key={photo.id} data-photo-id={photo.id} data-cursor="View photograph" to={`/photography/${series.id}?image=${photo.id}`} tabIndex={copy ? -1 : 0} aria-label={`Open ${series.title}: ${photo.alt}`} draggable={false}>
          <Photo photo={photo} eager={index < 6} sizes="(max-width: 767px) 55vw, 300px" />
        </Link>)}
      </div>)}</div>
    </div>
  </section>
}
