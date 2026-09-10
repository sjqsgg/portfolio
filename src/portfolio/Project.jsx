import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RevealText from './RevealText'
import { projects } from '../data/projects'

export default function Project() {
  const { projectId } = useParams()
  const project = projects.find(item => item.id === projectId)
  const [chapter, setChapter] = useState(0)
  if (!project) return <section className="page error-page"><h1>Project not found.</h1><Link to="/projects">All projects ↗</Link></section>
  const selected = project.chapters[chapter % project.chapters.length]
  const move = direction => setChapter(value => (value + direction + project.chapters.length) % project.chapters.length)
  return <article className="page project-page">
    <Link className="back-link" to="/projects">← All projects</Link>
    <div className="project-layout"><div className="project-info"><span className="meta muted">{project.status}</span><RevealText as="h1">{project.title}</RevealText><p className="project-summary">{project.summary}</p>
      <dl className="project-metadata">{[['Category', project.category], ['Role', project.role], ['Status', project.status], ['Year', project.year]].map(([label, value]) => <div key={label}><dt className="meta muted">{label.toUpperCase()}</dt><dd>{value}</dd></div>)}</dl>
      {project.href && <Link className="underlined-link" to={project.href}>Explore the project ↗</Link>}
      <details className="project-notes"><summary>Project notes <span aria-hidden="true">+</span></summary><p>{project.notes}</p></details>
    </div><div className="project-viewer" tabIndex={0} aria-label="Project images. Use left and right arrow keys to change image." onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) } }}>
      <figure><img src={selected.image} alt={selected.alt} width="900" height="748" /><figcaption aria-live="polite">{selected.caption}</figcaption></figure>
      {project.chapters.length > 1 && <div className="chapter-controls"><button className="chapter-arrow" aria-label="Previous image" onClick={() => move(-1)}>←</button><div className="project-thumbnails">{project.chapters.map((item, index) => <button key={item.label} onClick={() => setChapter(index)} aria-pressed={chapter === index} aria-label={`Show ${item.label}`}><img src={item.image} alt="" width="80" height="60" /><span className="meta">{item.label}</span></button>)}</div><button className="chapter-arrow" aria-label="Next image" onClick={() => move(1)}>→</button></div>}
    </div></div>
  </article>
}
