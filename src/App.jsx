import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import Home from './portfolio/Home'
import BackHome from './portfolio/BackHome'
import FollowCursor from './portfolio/FollowCursor'
import useRouteMotion from './portfolio/useRouteMotion'
import './App.css'
import './portfolio/workspace.css'
import './portfolio/posterAnchors.css'
import './portfolio/reference-layout.css'
import './portfolio/motion.css'

import Photography from './portfolio/Photography'
import Series from './portfolio/Series'
import Projects from './portfolio/Projects'
import Project from './portfolio/Project'
import About from './portfolio/About'
import Contact from './portfolio/Contact'

const Rates = lazy(() => import('./components/Rate'))
const Blog = lazy(() => import('./components/Blog'))

class PageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <section className="page error-page"><h1>This page couldn’t load.</h1><p>Please try again.</p><a href={window.location.pathname}>Reload page ↗</a></section> : this.props.children
  }
}
export default function App() {
  const [theme, setTheme] = useState('day')
  const [resetKey, setResetKey] = useState(0)
  const [flash, setFlash] = useState(null)
  const timers = useRef([])
  const reduced = useReducedMotion()
  const incoming = useLocation()
  const location = useRouteMotion(incoming, reduced)
  const navigate = useNavigate()
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const section = location.pathname.startsWith('/projects') ? 'Projects' : location.pathname.startsWith('/photography') ? 'Photography' : location.pathname === '/about' ? 'About' : location.pathname === '/contact' ? 'Contact' : 'Software engineer & photographer'
    document.title = `${section} | Jiaqi Shi`

  }, [location.pathname])
  function toggleTheme() {
    setTheme(value => value === 'day' ? 'night' : 'day')
  }
  function revertHome() {
    setTheme('day')
    setResetKey(value => value + 1)
    if (location.pathname !== '/') navigate('/')
  }
  function openCamera(event) {
    if (flash) return
    if (reduced) { navigate('/photography'); return }
    const box = event?.currentTarget?.getBoundingClientRect?.()
    const x = event?.clientX || (box ? box.x + box.width / 2 : window.innerWidth * .68)
    const y = event?.clientY || (box ? box.y + box.height / 2 : window.innerHeight * .55)
    setFlash({ x, y })
    timers.current = [setTimeout(() => navigate('/photography'), 460), setTimeout(() => setFlash(null), 1000)]
  }
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className={`canvas-identity ${location.pathname.startsWith('/photography') ? 'photography-navigation' : ''}`}>
      {location.pathname === '/' ? <Link to="/" className="identity-link" aria-label="Jiaqi Shi, home"><span className="meta muted">SOFTWARE ENGINEER & PHOTOGRAPHER</span><span className="identity-name">JIAQI SHI</span></Link> : location.pathname.startsWith('/photography/') ? <Link to="/photography" className="back-circle-control" aria-label="Back to gallery" data-cursor="Gallery"><span className="close-cross" aria-hidden="true">×</span></Link> : <BackHome />}
      <nav id="primary-nav" className="canvas-nav" aria-label="Main navigation">
        {[['/', 'Home'], ['/projects', 'Projects'], ['/photography', 'Photography'], ['/about', 'About'], ['/contact', 'Contact']].map(([path, label]) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return <Link key={path} to={path} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{label}</Link>
        })}
      </nav>
    </header>
    {location.pathname === '/' && <><aside className="canvas-base"><span className="meta muted">BASE</span><span>THE NETHERLANDS</span></aside><button className="canvas-revert" onClick={revertHome}>Revert</button></>}
    <main id="main-content" tabIndex={-1}>
      <PageBoundary key={location.pathname}><Suspense fallback={<div className="page loading-page" role="status">Opening…</div>}>
        <Routes location={location}>
          <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} openCamera={openCamera} resetKey={resetKey} />} />
          <Route path="/photography" element={<Photography />} />
          <Route path="/photography/:seriesId" element={<Series />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/software" element={<Navigate to="/projects" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rate" element={<div className="page legacy-page"><Rates /></div>} />
          <Route path="/blog" element={<div className="page legacy-page"><Blog /></div>} />
          <Route path="*" element={<section className="page error-page"><p className="meta">404</p><h1>A little off the map.</h1><Link to="/">Back to the workbench ↗</Link></section>} />
        </Routes>
      </Suspense></PageBoundary>
    </main>
    <FollowCursor />
    {flash && <div className="camera-transition" aria-hidden="true" style={{ '--flash-x': `${flash.x}px`, '--flash-y': `${flash.y}px` }}><div className="flash-star" /><div className="flash-afterimage" /></div>}
  </>
}
