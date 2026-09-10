import { useReducedMotion } from 'motion/react'
import { series } from '../data/series'
import GalleryRow from './GalleryRow'
import RevealText from './RevealText'

export default function Photography() {
  const reduced = useReducedMotion()
  return <div className="photography-page">
    <header className="photography-heading"><div><RevealText as="h1">Photography</RevealText><RevealText>People, places and the energy between them.</RevealText></div></header>
    <div className={`gallery-rows ${document.documentElement.dataset.routeMotion === 'photo-close' ? 'is-returning' : ''}`}>{series.map((item, index) => <GalleryRow key={item.id} series={item} reverse={index === 1} reduced={reduced} />)}</div>
  </div>
}
