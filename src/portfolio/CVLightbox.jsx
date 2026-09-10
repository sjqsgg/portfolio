import { useEffect, useRef } from 'react'
import { assetPath } from '../data/assetPath'

export const cvUrl = assetPath('/documents/jiaqi-shi-cv-2026.pdf')
const cvPreviewUrl = assetPath('/documents/jiaqi-shi-cv-2026.png')
export const cvFilename = 'Jiaqi Shi 2026 CV.pdf'

export default function CVLightbox({ onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const node = dialog.current
    const trigger = document.activeElement
    node.showModal()
    return () => { node.close(); trigger?.focus?.({ preventScroll: true }) }
  }, [])
  return <dialog ref={dialog} className="cv-lightbox" aria-labelledby="cv-title"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="cv-window">
      <header className="cv-toolbar"><h2 id="cv-title">Jiaqi Shi · CV</h2><div>
        <a className="cv-icon" href={cvUrl} download={cvFilename} aria-label="Download my CV" title="Download my CV"><span className="download-icon" aria-hidden="true">↓</span></a>
        <button autoFocus className="cv-icon" onClick={onClose} aria-label="Close CV" title="Close CV">×</button>
      </div></header>
      <div className="cv-page" tabIndex={0} role="region" aria-label="CV page"><img src={cvPreviewUrl} width="1697" height="2400" alt="Jiaqi Shi’s CV: contact details, skills, education, work and project experience. Open the PDF below for selectable text." /></div>
      <footer className="cv-footer"><span>1 / 1</span><a href={cvUrl} target="_blank" rel="noreferrer">Open PDF ↗</a></footer>
    </div>
  </dialog>
}
