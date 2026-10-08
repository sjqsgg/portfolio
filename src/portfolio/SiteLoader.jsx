export default function SiteLoader() {
  return <div className="site-loader is-loading" role="status" aria-live="polite" aria-label="Loading the workbench">
    <div className="site-loader-type" aria-hidden="true">
      <span className="site-loader-word">
        {'Loading...'.split('').map((letter, index) => <span className="site-loader-letter" style={{ '--letter': index }} key={index}>{letter}</span>)}
      </span>
    </div>
  </div>
}
