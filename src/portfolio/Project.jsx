import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RevealText from './RevealText'
import { projects } from '../data/projects'

function ProjectVideo({ chapter }) {
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)
  return started ? <><video controls autoPlay playsInline preload="none" poster={chapter.image} src={chapter.video} onError={() => setFailed(true)} aria-label="Project demo video" />{failed && <p>Video could not load. <a href={chapter.video}>Open video</a></p>}</> : <button className="project-video-cover" onClick={() => setStarted(true)} aria-label="Play demo"><img src={chapter.image} alt={chapter.alt} width="1280" height="720" /><span>Play demo ▶</span></button>
}

export default function Project() {
  const { projectId } = useParams()
  const project = projects.find(item => item.id === projectId)
  const [chapter, setChapter] = useState(0)
  const [posterOpen, setPosterOpen] = useState(false)
  const posterDialog = useRef(null)
  useEffect(() => {
    if (!posterOpen) return
    const dialog = posterDialog.current
    const trigger = document.activeElement
    dialog.showModal()
    return () => { dialog.close(); trigger?.focus?.({ preventScroll: true }) }
  }, [posterOpen])
  if (!project) return <section className="page error-page"><h1>Project not found.</h1><Link to="/projects">All projects ↗</Link></section>
  const selected = project.chapters[chapter % project.chapters.length]
  const move = direction => setChapter(value => (value + direction + project.chapters.length) % project.chapters.length)
  return <article className="page project-page">
    <div className="project-layout"><div className="project-info">{project.type && <span className="meta muted">{project.type}</span>}<RevealText as="h1">{project.title}</RevealText><p className="project-summary">{project.summary}</p>
      <dl className="project-metadata">{[['Category', project.category], ['Role', project.role], ['Status', project.status], ['Year', project.year]].map(([label, value]) => <div key={label}><dt className="meta muted">{label.toUpperCase()}</dt><dd>{value}</dd></div>)}</dl>
      {project.href && <Link className="underlined-link" to={project.href}>Explore the project ↗</Link>}
      {project.links?.map(link => <a key={link.href} className="underlined-link" href={link.href} download={link.download} target={link.download ? undefined : '_blank'} rel="noreferrer">{link.label} ↗</a>)}
      {project.notes && <details className="project-notes"><summary>Project notes <span aria-hidden="true">+</span></summary>{(Array.isArray(project.notes) ? project.notes : [project.notes]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</details>}
    </div><div className="project-viewer" tabIndex={0} aria-label="Project media. Use left and right arrow keys to change chapter." onKeyDown={event => { if (event.target.tagName === 'VIDEO') return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) } }}>
      <figure>{selected.video ? <ProjectVideo key={selected.video} chapter={selected} /> : <img src={selected.image} alt={selected.alt} width="900" height="748" />}<figcaption aria-live="polite">{selected.caption}</figcaption></figure>
      {selected.fullImage && <button className="underlined-link" onClick={() => setPosterOpen(true)}>Enlarge poster ↗</button>}
      {project.chapters.length > 1 && <div className="chapter-controls"><button className="chapter-arrow" aria-label="Previous image" onClick={() => move(-1)}>←</button><div className="project-thumbnails">{project.chapters.map((item, index) => <button key={item.label} onClick={() => setChapter(index)} aria-pressed={chapter === index} aria-label={`Show ${item.label}`}><img src={item.image} alt="" width="80" height="60" /><span className="meta">{item.label}</span></button>)}</div><button className="chapter-arrow" aria-label="Next image" onClick={() => move(1)}>→</button></div>}
    </div></div>
    {posterOpen && <dialog ref={posterDialog} className="project-poster-dialog" aria-label={`${project.title} research poster`} onCancel={event => { event.preventDefault(); setPosterOpen(false) }} onClick={event => { if (event.target === event.currentTarget) setPosterOpen(false) }}><button autoFocus onClick={() => setPosterOpen(false)} aria-label="Close poster">Close ×</button><div tabIndex={0} aria-label="Scrollable poster"><img src={selected.image} alt={selected.alt} /></div></dialog>}
  </article>
}
