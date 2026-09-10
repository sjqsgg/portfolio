import { Link, useParams, useSearchParams } from 'react-router-dom'
import { orderedPhotos, series } from '../data/series'
import Photo from './Photo'
import RevealText from './RevealText'

export default function Series() {
  const { seriesId } = useParams()
  const [params] = useSearchParams()
  const collection = series.find(item => item.id === seriesId)
  if (!collection) return <section className="page error-page"><h1>Series not found.</h1><Link to="/photography">All photography ↗</Link></section>
  const photos = orderedPhotos(collection.photos, params.get('image'))
  const next = series[(series.indexOf(collection) + 1) % series.length]
  return <article className="series-page page">
    <div className="series-opening">
      <header className="series-intro text-arrival"><span className="meta muted">PHOTO SERIES</span><RevealText as="h1">{collection.title}</RevealText><p>{collection.description}</p><div className="series-location meta muted">{collection.location}</div></header>
      <figure className="series-selected"><Photo photo={photos[0]} eager sizes="(max-width: 767px) 90vw, 45vw" /><figcaption className="meta muted">{photos[0].alt}</figcaption></figure>
      <div className="series-entry meta muted">{String(collection.photos.indexOf(photos[0]) + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}<br />{collection.title}</div>
    </div>
    <div className="series-continuation">{photos.slice(1).map((photo, index) => <figure key={photo.id} className={`series-image composition-${index % 5}`}><Photo photo={photo} sizes="(max-width: 767px) 90vw, 65vw" /><figcaption className="meta muted">{photo.alt}</figcaption></figure>)}</div>
    <nav className="series-pagination" aria-label="Photo series navigation"><Link to="/photography">← Photography</Link><Link to={`/photography/${next.id}`}>{next.title} →</Link></nav>
  </article>
}
