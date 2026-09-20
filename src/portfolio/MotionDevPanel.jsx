import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const storageKey = 'jiaqi-motion-tuning-v1'
const defaults = { darken: 490, hold: 560, curve: 990, finish: 190 }
const controls = [
  ['darken', 'Darken time', 200, 900, 10],
  ['hold', 'Dark hold', 0, 600, 10],
  ['curve', 'Curve rise', 700, 2300, 10],
  ['finish', 'Final fade', 80, 500, 10],
]

function readSaved() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey)) } }
  catch { return defaults }
}

function apply(values) {
  const root = document.documentElement
  const textDelay = values.hold + values.curve * .414
  root.style.setProperty('--route-darken-duration', `${values.darken}ms`)
  root.style.setProperty('--route-curve-delay', `${values.hold}ms`)
  root.style.setProperty('--route-curve-duration', `${values.curve}ms`)
  root.style.setProperty('--route-finish-delay', `${values.hold + values.curve + 20}ms`)
  root.style.setProperty('--route-finish-duration', `${values.finish}ms`)
  root.style.setProperty('--route-text-delay-base', `${Math.round(textDelay)}ms`)
}

export default function MotionDevPanel() {
  const [values, setValues] = useState(readSaved)
  const [collapsed, setCollapsed] = useState(false)
  const [message, setMessage] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const total = useMemo(() => values.hold + values.curve + values.finish + 20, [values])

  useEffect(() => {
    apply(values)
    localStorage.setItem(storageKey, JSON.stringify(values))
  }, [values])

  function update(key, value) { setValues(current => ({ ...current, [key]: value })) }
  function reset() { setValues(defaults); setMessage('Defaults restored') }
  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(values, null, 2))
    setMessage('Timing copied')
  }
  function preview() {
    setMessage('')
    navigate({ pathname: location.pathname === '/contact' ? '/about' : '/contact', search:'?motiondev=1' })
  }

  return <aside className={`motion-dev-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label="Page motion controls">
    <header className="motion-dev-header">
      <div><span>MOTION / LOCAL</span><strong>Page transition timing</strong></div>
      <button type="button" aria-expanded={!collapsed} aria-label={collapsed ? 'Open motion controls' : 'Collapse motion controls'} onClick={() => setCollapsed(value => !value)}>{collapsed ? '+' : '-'}</button>
    </header>
    {!collapsed && <>
      <div className="motion-dev-body">
        {controls.map(([key, label, min, max, step]) => <label className="motion-dev-control" key={key}>
          <span>{label}</span>
          <input aria-label={`${label} in milliseconds`} type="range" min={min} max={max} step={step} value={values[key]} onChange={event => update(key, Number(event.target.value))} />
          <input aria-label={`${label} value`} type="number" min={min} max={max} step={step} value={values[key]} onChange={event => update(key, Number(event.target.value))} />
          <small>ms</small>
        </label>)}
        <div className="motion-dev-summary"><span>Estimated total</span><output>{total} ms</output></div>
        <p>Changes apply to the next page transition and stay in this browser.</p>
      </div>
      <footer className="motion-dev-footer">
        <span role="status">{message}</span>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={copy}>Copy</button>
        <button type="button" className="motion-dev-preview" onClick={preview}>Play preview</button>
      </footer>
    </>}
  </aside>
}
