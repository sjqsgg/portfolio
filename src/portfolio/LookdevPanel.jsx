import { useEffect, useMemo, useState } from 'react'

const storageKey = 'jiaqi-workstation-lookdev-v1'
const defaultTransform = { scaleX: 1, scaleY: 1, scaleZ: 1, thickness: 1, positionX: 0, positionY: 0, positionZ: 0, rotationX: 0, rotationY: 0, rotationZ: 0, lockPosition: true }

function NumberControl({ label, value, min, max, step, onChange }) {
  return <label className="lookdev-control">
    <span>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    <input type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>
}

function readSaved() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} }
}

export default function LookdevPanel({ api }) {
  const [collapsed, setCollapsed] = useState(false)
  const [tab, setTab] = useState('structure')
  const [partId, setPartId] = useState('workstation')
  const [materialName, setMaterialName] = useState('Pale_ash')
  const [parts, setParts] = useState({})
  const [materials, setMaterials] = useState({})
  const [lighting, setLighting] = useState({ exposure: .98, ambient: .85, key: 3, fill: .65, practical: 0 })
  const [message, setMessage] = useState('')

  const materialDefaults = useMemo(() => Object.fromEntries((api?.materials || []).map(({ name, ...values }) => [name, values])), [api])
  useEffect(() => {
    if (!api) return
    const saved = readSaved()
    const nextParts = saved.parts || {}
    const nextMaterials = saved.materials || {}
    const nextLighting = { ...api.lighting, ...saved.lighting }
    setParts(nextParts); setMaterials(nextMaterials); setLighting(nextLighting)
    setPartId(current => api.parts.some(part => part.id === current) ? current : api.parts[0]?.id || '')
    setMaterialName(current => api.materials.some(material => material.name === current) ? current : api.materials[0]?.name || '')
    Object.entries(nextParts).forEach(([id, values]) => api.applyPart(id, { ...defaultTransform, ...values }))
    Object.entries(nextMaterials).forEach(([name, values]) => api.applyMaterial(name, { ...materialDefaults[name], ...values }))
    api.applyLighting(nextLighting)
  }, [api, materialDefaults])

  if (!api) return <aside className="lookdev-panel is-loading" aria-label="Workstation look development controls"><span>LOOKDEV</span><span>Loading model…</span></aside>
  const part = { ...defaultTransform, ...parts[partId] }
  const partSpec = api.parts.find(item => item.id === partId)
  const material = { ...materialDefaults[materialName], ...materials[materialName] }
  const payload = { version: 1, parts, materials, lighting }
  function updatePart(key, value) {
    const next = { ...part, [key]: value }
    setParts(current => ({ ...current, [partId]: next })); api.applyPart(partId, next)
  }
  function updateMaterial(key, value) {
    const next = { ...material, [key]: value }
    setMaterials(current => ({ ...current, [materialName]: next })); api.applyMaterial(materialName, next)
  }
  function updateLighting(key, value) {
    const next = { ...lighting, [key]: value }
    setLighting(next); api.applyLighting(next)
  }
  function flash(value) { setMessage(value); window.setTimeout(() => setMessage(''), 1800) }
  function save() { localStorage.setItem(storageKey, JSON.stringify(payload)); flash('Saved on this device') }
  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); flash('Parameters copied')
  }
  function resetCurrent() {
    if (tab === 'structure' && partId === 'workstation') {
      api.reset(); localStorage.removeItem(storageKey); setParts({}); setMaterials({}); setLighting(api.lighting); flash('Restored whole workstation')
      return
    }
    if (tab === 'structure') {
      api.resetPart(partId)
      setParts(current => { const next = { ...current }; delete next[partId]; return next })
      flash('Restored current part')
      return
    }
    if (tab === 'surface') {
      api.resetMaterial(materialName)
      setMaterials(current => { const next = { ...current }; delete next[materialName]; return next })
      flash('Restored current material')
      return
    }
    api.resetLighting(); setLighting(api.lighting); flash('Restored lighting')
  }
  function applyStructurePreset(scaleX, scaleY, scaleZ) {
    const next = { ...part, scaleX, scaleY, scaleZ }
    setParts(current => ({ ...current, [partId]: next })); api.applyPart(partId, next)
  }
  function applySurfacePreset(roughness, metalness, clearcoat) {
    const next = { ...material, roughness, metalness, clearcoat }
    setMaterials(current => ({ ...current, [materialName]: next })); api.applyMaterial(materialName, next)
  }
  function applyLightPreset(values) { setLighting(values); api.applyLighting(values) }
  return <aside className={`lookdev-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label="Workstation look development controls">
    <header className="lookdev-header">
      <div><span className="lookdev-kicker">WORKSTATION / LOOKDEV</span><strong>Material & proportion check</strong></div>
      <button type="button" onClick={() => setCollapsed(value => !value)} aria-expanded={!collapsed} aria-label={collapsed ? 'Open look development controls' : 'Collapse look development controls'}>{collapsed ? '＋' : '—'}</button>
    </header>
    {!collapsed && <>
      <nav className="lookdev-tabs" aria-label="Control category">
        {['structure', 'surface', 'light'].map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </nav>
      <div className="lookdev-body">
        {tab === 'structure' && <>
          <label className="lookdev-select"><span>Part</span><select value={partId} onChange={event => setPartId(event.target.value)}>{api.parts.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button className="lookdev-reset-current" onClick={resetCurrent}>{partId === 'workstation' ? 'Reset whole workstation' : 'Reset selected part'}</button>
          <label className="lookdev-lock"><input type="checkbox" checked={part.lockPosition} onChange={event => updatePart('lockPosition', event.target.checked)} /><span>Keep position fixed while resizing</span></label>
          <p className="lookdev-note">Size changes keep the visual centre fixed. Final tube diameter and joints are rebuilt in Blender after approval.</p>
          <div className="lookdev-presets"><button onClick={() => applyStructurePreset(1, 1, 1)}>Original</button><button onClick={() => applyStructurePreset(1.02, 1, .98)}>Balanced</button><button onClick={() => applyStructurePreset(1.04, .98, 1.03)}>Stylized</button></div>
          <fieldset><legend>Scale</legend>
            <NumberControl label="Width X" value={part.scaleX} min={.7} max={1.3} step={.01} onChange={value => updatePart('scaleX', value)} />
            <NumberControl label="Height Y" value={part.scaleY} min={.7} max={1.3} step={.01} onChange={value => updatePart('scaleY', value)} />
            <NumberControl label="Length Z" value={part.scaleZ} min={.7} max={1.3} step={.01} onChange={value => updatePart('scaleZ', value)} />
            {partSpec?.supportsThickness && <NumberControl label="Tube thickness" value={part.thickness} min={.5} max={2} step={.02} onChange={value => updatePart('thickness', value)} />}
          </fieldset>
          <fieldset><legend>Position / metres</legend>
            <NumberControl label="Left ↔ right" value={part.positionX} min={-.3} max={.3} step={.005} onChange={value => updatePart('positionX', value)} />
            <NumberControl label="Down ↔ up" value={part.positionY} min={-.3} max={.3} step={.005} onChange={value => updatePart('positionY', value)} />
            <NumberControl label="Back ↔ front" value={part.positionZ} min={-.3} max={.3} step={.005} onChange={value => updatePart('positionZ', value)} />
          </fieldset>
          <fieldset><legend>Rotation / degrees</legend>
            <NumberControl label="Tilt X" value={part.rotationX} min={-180} max={180} step={1} onChange={value => updatePart('rotationX', value)} />
            <NumberControl label="Turn Y" value={part.rotationY} min={-180} max={180} step={1} onChange={value => updatePart('rotationY', value)} />
            <NumberControl label="Roll Z" value={part.rotationZ} min={-180} max={180} step={1} onChange={value => updatePart('rotationZ', value)} />
          </fieldset>
        </>}
        {tab === 'surface' && material && <>
          <label className="lookdev-select"><span>Material</span><select value={materialName} onChange={event => setMaterialName(event.target.value)}>{api.materials.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
          <button className="lookdev-reset-current" onClick={resetCurrent}>Reset selected material</button>
          <div className="lookdev-presets"><button onClick={() => applySurfacePreset(.68, 0, 0)}>Soft matte</button><button onClick={() => applySurfacePreset(.46, material.metalness, .08)}>Satin</button><button onClick={() => applySurfacePreset(.25, material.metalness, .22)}>Polished</button></div>
          <label className="lookdev-color"><span>Base colour</span><input type="color" value={`#${material.color}`} onChange={event => updateMaterial('color', event.target.value.replace('#', ''))} /><code>#{material.color}</code></label>
          <NumberControl label="Roughness" value={material.roughness} min={0} max={1} step={.01} onChange={value => updateMaterial('roughness', value)} />
          <NumberControl label="Metalness" value={material.metalness} min={0} max={1} step={.01} onChange={value => updateMaterial('metalness', value)} />
          <NumberControl label="Clearcoat" value={material.clearcoat} min={0} max={1} step={.01} onChange={value => updateMaterial('clearcoat', value)} />
        </>}
        {tab === 'light' && <>
          <button className="lookdev-reset-current" onClick={resetCurrent}>Reset all lighting</button>
          <div className="lookdev-presets"><button onClick={() => applyLightPreset({ exposure:.98, ambient:.85, key:3, fill:.65, practical:0 })}>Neutral</button><button onClick={() => applyLightPreset({ exposure:.95, ambient:1.05, key:2.4, fill:1, practical:.2 })}>Soft product</button><button onClick={() => applyLightPreset({ exposure:1.02, ambient:.68, key:3.4, fill:1.15, practical:.35 })}>Warm / cool</button></div>
          <NumberControl label="Exposure" value={lighting.exposure} min={.5} max={1.5} step={.01} onChange={value => updateLighting('exposure', value)} />
          <NumberControl label="Ambient" value={lighting.ambient} min={0} max={2} step={.05} onChange={value => updateLighting('ambient', value)} />
          <NumberControl label="Key" value={lighting.key} min={0} max={6} step={.05} onChange={value => updateLighting('key', value)} />
          <NumberControl label="Fill" value={lighting.fill} min={0} max={3} step={.05} onChange={value => updateLighting('fill', value)} />
          <NumberControl label="Practical" value={lighting.practical} min={0} max={4} step={.05} onChange={value => updateLighting('practical', value)} />
        </>}
      </div>
      <footer className="lookdev-footer"><span role="status">{message}</span><button onClick={copy}>Copy JSON</button><button className="lookdev-save" onClick={save}>Save</button></footer>
    </>}
  </aside>
}
