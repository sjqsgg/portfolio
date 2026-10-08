import { assetPath } from '../data/assetPath'
import { workbenchEntrance } from './workbenchEntrance'

export default function SiteLoader({ phase }) {
  return <div className={`site-loader is-${phase}`} style={{ '--loader-reveal': `${workbenchEntrance.revealMs}ms` }} role="status" aria-live="polite" aria-label="Opening Jiaqi Shi’s workbench">
    <div className="site-loader-backdrop" />
    <div className="site-loader-picture" aria-hidden="true">
      <picture className="site-loader-arrival">
        <source media="(max-width:767px)" srcSet={assetPath('/images/workstation/intro-mobile.webp')} />
        <img className="site-loader-workbench" src={assetPath('/images/workstation/intro-day.webp')} width="1440" height="1000" fetchPriority="high" alt="" />
      </picture>
    </div>
    <span className="site-loader-label">{phase === 'loading' ? 'OPENING WORKBENCH' : 'WELCOME IN'}</span>
  </div>
}
