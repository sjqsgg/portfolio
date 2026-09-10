import { Link } from 'react-router-dom'
import RevealText from './RevealText'
import { projects } from '../data/projects'

export default function Projects() {
  return <div className="page projects-page"><header className="projects-heading"><RevealText as="h1" lines={["I find problems,", "build systems,", "and make useful things."]} /><p className="muted">Software engineering<br />AI, automation & product building</p></header>
    <div className="project-list">{projects.map((project, index) => <Link key={project.id} className="project-row" data-cursor="View project" to={`/projects/${project.id}`}><span className="meta project-number">{String(index + 1).padStart(2, '0')}</span><div className="project-description"><h2>{project.title} <span className="project-arrow" aria-hidden="true">↗</span></h2><p>{project.category}</p><span className="meta muted">{project.status}</span></div><img src={project.image} alt={project.imageAlt} width="900" height="748" loading={index ? 'lazy' : 'eager'} /></Link>)}</div>
    <div className="projects-end"><p>More work is taking shape.</p><Link to="/contact">Let’s talk ↗</Link></div>
  </div>
}
