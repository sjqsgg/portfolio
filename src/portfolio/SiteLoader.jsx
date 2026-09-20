export default function SiteLoader({ phase }) {
  return <div className={`site-loader is-${phase}`} role="status" aria-live="polite" aria-label="Opening Jiaqi Shi’s workbench">
    <span className="site-loader-name">JIAQI SHI</span>
    <div className="site-loader-mark" aria-hidden="true">
      <span className="site-loader-line site-loader-line-horizontal" />
      <span className="site-loader-line site-loader-line-vertical" />
      <span className="site-loader-panel" />
    </div>
    <span className="site-loader-label">OPENING WORKBENCH</span>
  </div>
}
