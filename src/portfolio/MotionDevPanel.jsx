import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const storageKey = 'jiaqi-motion-tuning-v1'
// The last 15% of the archived curve is already a sub-4px strip at 1440px.
// Treat that visual exit as the start of the truly white interval.
const visualCurveEnd = 0.85
const defaults = {
  darken: 340,
  hold: 80,
  curve: 890,
  whiteHold: 0,
  revealDuration: 760,
  revealOffset: 60,
}
const controls = [
  ['darken', 'Darken time', 200, 900, 10, 'ms'],
  ['hold', 'Dark hold', 0, 1000, 10, 'ms'],
  ['curve', 'Curve rise', 700, 2300, 10, 'ms'],
  ['whiteHold', 'White screen hold', 0, 1000, 10, 'ms'],
  ['revealDuration', 'Content reveal time', 200, 2000, 10, 'ms'],
  ['revealOffset', 'Content start offset', 0, 80, 1, 'px'],
]

function readSaved() {
  try {
    const saved = { ...JSON.parse(localStorage.getItem(storageKey)) }
    if (saved.whiteHold == null && saved.finish != null) saved.whiteHold = saved.finish
    delete saved.finish
    return { ...defaults, ...saved }
  }
  catch { return defaults }
}

function apply(values) {
  const root = document.documentElement
  const curveDelay = values.darken + values.hold
  const finishDelay = curveDelay + Math.round(values.curve * visualCurveEnd)
  const textDelay = finishDelay + values.whiteHold
  root.style.setProperty('--route-darken-duration', `${values.darken}ms`)
  root.style.setProperty('--route-curve-delay', `${curveDelay}ms`)
  root.style.setProperty('--route-curve-duration', `${values.curve}ms`)
  root.style.setProperty('--route-finish-delay', `${finishDelay}ms`)
  root.style.setProperty('--route-finish-duration', '1ms')
  root.style.setProperty('--route-text-delay-base', `${textDelay}ms`)
  root.style.setProperty('--route-text-duration', `${values.revealDuration}ms`)
  root.style.setProperty('--route-text-offset', `${values.revealOffset}px`)
}

export default function MotionDevPanel() {
  const [values, setValues] = useState(readSaved)
  const [collapsed, setCollapsed] = useState(false)
  const [message, setMessage] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const total = useMemo(() => values.darken + values.hold + Math.round(values.curve * visualCurveEnd) + values.whiteHold, [values])

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
        {controls.map(([key, label, min, max, step, unit]) => <label className="motion-dev-control" key={key}>
          <span>{label}</span>
          <input aria-label={`${label} in ${unit === 'px' ? 'pixels' : 'milliseconds'}`} type="range" min={min} max={max} step={step} value={values[key]} onChange={event => update(key, Number(event.target.value))} />
          <input aria-label={`${label} value`} type="number" min={min} max={max} step={step} value={values[key]} onChange={event => update(key, Number(event.target.value))} />
          <small>{unit}</small>
        </label>)}
        <div className="motion-dev-summary"><span>Text starts after</span><output>{total} ms</output></div>
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
