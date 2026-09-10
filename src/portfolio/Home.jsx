import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import CVLightbox from './CVLightbox'
import PegboardLightbox from './PegboardLightbox'
import { assetPath } from '../data/assetPath'

const Workbench = lazy(() => import('./Workbench'))

function DeskDocument({ kind, onClose }) {
  const dialog = useRef(null)
  const [note, setNote] = useState(() => { try { return localStorage.getItem('jiaqi-guestbook-draft') || '' } catch { return '' } })
  const [saved, setSaved] = useState('')
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close() }, [])
  function saveDraft(event) {
    event.preventDefault()
    try { localStorage.setItem('jiaqi-guestbook-draft', note); setSaved('Draft saved on this device.') } catch { setSaved('Storage is unavailable. You can still open your email app below.') }
  }
  return <dialog ref={dialog} className={`desk-document document-${kind}`} aria-labelledby="document-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="document-sheet">
      <button autoFocus className="document-close" onClick={onClose} aria-label="Put back on the desk">Close ×</button>
      <p className="meta muted">{kind === 'cv' ? 'FROM THE PAPER RACK / 01' : kind === 'badge' ? 'FROM THE PEGBOARD / 02' : 'FROM THE PHOTOGRAPHY DESK / 03'}</p>
      <h2 id="document-title">{kind === 'guestbook' ? 'Leave a little note.' : 'Jiaqi Shi'}</h2>
      {kind === 'guestbook' ? <form onSubmit={saveDraft}>
        <p>A thought, a hello, a place worth photographing.</p>
        <label htmlFor="guest-note">Your note</label>
        <textarea id="guest-note" value={note} maxLength={2000} onChange={e => { setNote(e.target.value); setSaved('') }} rows={5} placeholder="Hello, Jiaqi…" />
        <div className="note-actions"><button type="submit" className="underlined-link">Save draft</button><a className="underlined-link" href={`mailto:jiaqii7@outlook.com?subject=Hello%20from%20your%20workbench&body=${encodeURIComponent(note)}`}>Open in email ↗</a></div>
        <p className="document-fineprint muted">Drafts stay on this device. Send your note from your email app.</p><p role="status" className="document-fineprint">{saved}</p>
      </form> : <>
        <p className="document-role">Software engineer<br />& photographer.</p>
        <dl className="document-details"><div><dt className="meta muted">BASED IN</dt><dd>The Netherlands</dd></div><div><dt className="meta muted">FOCUS</dt><dd>Useful software.<br />People, places and moments.</dd></div></dl>
        <div className="document-links"><Link to="/about">A little more about me ↗</Link><a href="mailto:jiaqii7@outlook.com">Say hello ↗</a></div>
      </>}
      <span className="document-signature meta">JIAQI SHI — PERSONAL WORKBENCH</span>
    </div>
  </dialog>
}

export default function Home({ theme, toggleTheme, openCamera, resetKey }) {
  const reduced = useReducedMotion()
  const [status, setStatus] = useState('loading')
  const [view, setView] = useState('overview')
  const [object, setObject] = useState(null)
  const [boardOpen, setBoardOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)
  const home = useRef(null)
  const lastTrigger = useRef(null)
  const useStatic = reduced || navigator.connection?.saveData
  useEffect(() => { setObject(null); setDocumentOpen(false); setBoardOpen(false); setView('overview') }, [resetKey])
  useEffect(() => {
    if (!object) { setDocumentOpen(false); return }
    const timer = setTimeout(() => setDocumentOpen(true), useStatic || status === 'error' ? 0 : 1900)
    return () => clearTimeout(timer)
  }, [object, useStatic, status])
  useEffect(() => {
    if (documentOpen || boardOpen || !lastTrigger.current) return
    const frame = requestAnimationFrame(() => lastTrigger.current?.focus?.({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [documentOpen, boardOpen])
  function selectView(value) { setObject(null); setDocumentOpen(false); setView(value) }
  function showBoard(event) { lastTrigger.current = event?.currentTarget || document.activeElement; setBoardOpen(true) }
  function inspect(value, event) {
    lastTrigger.current = event?.currentTarget || document.activeElement
    if (value === 'guestbook' && view !== 'photo') { selectView('photo'); return }
    setView(value === 'guestbook' ? 'photo' : 'work'); setObject(value)
  }
  function putBack() { setObject(null); setDocumentOpen(false) }
  const hotspots = [
    ['monitor', view === 'work' ? 'Open projects' : 'Work & ideas', view === 'work' ? '/projects' : () => selectView('work')],
    ['camera', view === 'photo' ? 'Open photography' : 'Photography', view === 'photo' ? openCamera : () => selectView('photo')],
    ['film', view === 'photo' ? 'Open photography with film camera' : 'Film camera area', view === 'photo' ? openCamera : () => selectView('photo')],
    ['lens', 'Camera lenses', () => selectView('photo')],
    ['mug', 'Photography desk', () => selectView('photo')],
    ['audio', 'Photography shelves', () => selectView('photo')],
    ['guestbook', view === 'photo' ? 'Leave a note' : 'Photography book', event => inspect('guestbook', event)],
    ['board', 'Open pegboard', showBoard],
    ['lamp', `Desk lamp: switch to ${theme === 'day' ? 'night' : 'day'} mode`, toggleTheme],
    ...(view === 'work' ? [['cv', 'Curriculum vitae', event => inspect('cv', event)], ['badge', 'About me', event => inspect('badge', event)]] : []),
  ]
  return <section ref={home} className={`home immersive-home view-${view}`} aria-label="Jiaqi Shi’s workbench" data-view={view} data-object={object || 'none'}>
    <h1 className="sr-only">Jiaqi Shi, software engineer & photographer</h1>
    <div className="workbench-stage">
      {(useStatic || status !== 'ready') && <picture className="workbench-poster"><source media="(max-width: 767px)" srcSet={assetPath(`/images/workstation/${view}-mobile.webp`)} /><img src={assetPath(`/images/workstation/${view}-day.webp`)} width="1440" height="1000" fetchPriority="high" alt="An L-shaped workstation with a monitor, cameras, a green desk lamp, shelves and speakers." /></picture>}
      {!useStatic && <Suspense fallback={null}><Workbench theme={theme} toggleTheme={toggleTheme} openCamera={openCamera} onStatus={setStatus} home={home} view={view} object={object} onView={selectView} onInspect={inspect} onBoard={showBoard} resetKey={resetKey} /></Suspense>}
    </div>
    <div className={`scene-hotspots ${useStatic || status !== 'ready' ? 'fallback-labels' : ''}`} aria-label="Objects on the desk">
      {hotspots.map(([id, label, action]) => typeof action === 'string'
        ? <Link key={id} className="scene-hotspot" data-anchor={id} aria-label={label} to={action}><span className="sr-only">{label}</span></Link>
        : <button key={id} className="scene-hotspot" data-anchor={id} aria-label={label} onClick={action}><span className="sr-only">{label}</span></button>)}
    </div>
    {status === 'loading' && !useStatic && <p className="sr-only" role="status">Opening the workbench…</p>}
    {boardOpen && <PegboardLightbox onClose={() => setBoardOpen(false)} />}
    {documentOpen && object && (object === 'cv' ? <CVLightbox onClose={putBack} /> : <DeskDocument kind={object} onClose={putBack} />)}
  </section>
}
