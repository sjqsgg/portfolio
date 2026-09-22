import { useEffect, useMemo, useState } from 'react'

const storageKey = 'jiaqi-workstation-lookdev-draft'
const legacyStorageKeys = ['jiaqi-workstation-lookdev-v2', 'jiaqi-workstation-lookdev-v1']
const defaultTransform = { scaleX: 1, scaleY: 1, scaleZ: 1, thickness: 1, positionX: 0, positionY: 0, positionZ: 0, rotationX: 0, rotationY: 0, rotationZ: 0, lockPosition: true }
const materialLabels = {
  Felt_board_walnut: 'Felt board frame',
  Felt_board_fabric: 'Felt board insert',
  Felt_board_groove: 'Felt board groove',
  Computer_case_muted_internals: 'Computer internals',
  Computer_case_warm_shell: 'Computer shell',
  Computer_case_sage_accent: 'Computer accent',
  Computer_case_smoked_glass: 'Computer side glass',
}

function NumberControl({ label, value, min, max, step, onChange }) {
  return <label className="lookdev-control">
    <span>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    <input type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>
}

function readSaved() {
  try {
    const active = localStorage.getItem(storageKey)
    return {
      value: active ? JSON.parse(active) : {},
      hasLegacy: legacyStorageKeys.some(key => Boolean(localStorage.getItem(key))),
    }
  } catch { return { value: {}, hasLegacy: false } }
}

export default function LookdevPanel({ api }) {
  const [collapsed, setCollapsed] = useState(false)
  const [tab, setTab] = useState('structure')
  const [partId, setPartId] = useState('workstation')
  const [materialName, setMaterialName] = useState('Pale_ash')
  const [parts, setParts] = useState({})
  const [materials, setMaterials] = useState({})
  const [board, setBoard] = useState({})
  const [lighting, setLighting] = useState({ exposure: .98, ambient: .85, key: 3, fill: .65, practical: 0 })
  const [message, setMessage] = useState('')

  const materialDefaults = useMemo(() => Object.fromEntries((api?.materials || []).map(({ name, ...values }) => [name, values])), [api])
  useEffect(() => {
    if (!api) return
    const { value: saved, hasLegacy } = readSaved()
    const knownParts = new Set(api.parts.map(item => item.id))
    const knownMaterials = new Set(api.materials.map(item => item.name))
    const savedParts = Object.fromEntries(Object.entries(saved.parts || {}).filter(([id]) => knownParts.has(id)))
    const savedMaterials = Object.fromEntries(Object.entries(saved.materials || {}).filter(([name]) => knownMaterials.has(name)))
    const nextParts = { ...api.current.parts, ...savedParts }
    const nextMaterials = { ...api.current.materials, ...savedMaterials }
    const nextBoard = { ...api.current.board, ...saved.board }
    const nextLighting = { ...api.current.lighting, ...saved.lighting }
    setParts(nextParts); setMaterials(nextMaterials); setBoard(nextBoard); setLighting(nextLighting)
    setPartId(current => api.parts.some(part => part.id === current) ? current : api.parts[0]?.id || '')
    setMaterialName(current => api.materials.some(material => material.name === current) ? current : api.materials[0]?.name || '')
    Object.entries(nextParts).forEach(([id, values]) => api.applyPart(id, { ...defaultTransform, ...values }))
    Object.entries(nextMaterials).forEach(([name, values]) => api.applyMaterial(name, { ...materialDefaults[name], ...values }))
    api.applyBoard(nextBoard)
    api.applyLighting(nextLighting)
    if (hasLegacy && !Object.keys(saved).length) setMessage('Production baseline loaded; old drafts kept')
  }, [api, materialDefaults])

  if (!api) return <aside className="lookdev-panel is-loading" aria-label="Workstation look development controls"><span>LOOKDEV</span><span>Loading model…</span></aside>
  const part = { ...defaultTransform, ...parts[partId] }
  const partSpec = api.parts.find(item => item.id === partId)
  const material = { ...materialDefaults[materialName], ...materials[materialName] }
  const boardValues = { ...api.board, ...board }
  const payload = { version: 1, checkpoint: 'browser-draft', basedOn: api.current.checkpoint, parts, materials, board: boardValues, lighting }
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
  function updateBoard(key, value) {
    const next = { ...boardValues, [key]: value }
    setBoard(next); api.applyBoard(next)
  }
  function flash(value) { setMessage(value); window.setTimeout(() => setMessage(''), 1800) }
  function save() { localStorage.setItem(storageKey, JSON.stringify(payload)); flash('Draft saved on this device') }
  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); flash('Parameters copied')
  }
  function applyDraft(next, label) {
    if (next.version !== 1 || !next.parts || !next.materials || !next.lighting) throw new Error('Unsupported checkpoint')
    const knownParts = new Set(api.parts.map(item => item.id))
    const knownMaterials = new Set(api.materials.map(item => item.name))
    const nextParts = Object.fromEntries(Object.entries(next.parts).filter(([id]) => knownParts.has(id)))
    const nextMaterials = Object.fromEntries(Object.entries(next.materials).filter(([name]) => knownMaterials.has(name)))
    const nextLighting = { ...api.lighting, ...next.lighting }
    const nextBoard = { ...api.board, ...next.board }
    api.reset()
    Object.entries(nextParts).forEach(([id, values]) => api.applyPart(id, { ...defaultTransform, ...values }))
    Object.entries(nextMaterials).forEach(([name, values]) => api.applyMaterial(name, { ...materialDefaults[name], ...values }))
    api.applyLighting(nextLighting)
    api.applyBoard(nextBoard)
    setParts(nextParts); setMaterials(nextMaterials); setBoard(nextBoard); setLighting(nextLighting)
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, parts: nextParts, materials: nextMaterials, board: nextBoard, lighting: nextLighting }))
    flash(label)
  }
  async function importCheckpoint(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const next = JSON.parse(await file.text())
      applyDraft(next, `Loaded ${file.name}`)
    } catch {
      flash('Checkpoint could not be loaded')
    } finally { event.target.value = '' }
  }
  function resetCurrent() {
    if (tab === 'structure' && partId === 'workstation') {
      api.reset(); localStorage.removeItem(storageKey); setParts(api.current.parts); setMaterials(api.current.materials); setBoard(api.current.board); setLighting(api.current.lighting); flash('Restored live production baseline')
      return
    }
    if (tab === 'structure') {
      api.resetPart(partId)
      setParts(current => ({ ...current, [partId]: api.current.parts[partId] || defaultTransform }))
      flash('Restored current part')
      return
    }
    if (tab === 'surface') {
      api.resetMaterial(materialName)
      setMaterials(current => ({ ...current, [materialName]: materialDefaults[materialName] }))
      flash('Restored current material')
      return
    }
    if (tab === 'board') {
      api.resetBoard(); setBoard(api.current.board); flash('Restored felt board baseline')
      return
    }
    api.resetLighting(); setLighting(api.current.lighting); flash('Restored lighting')
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
      <button type="button" onClick={() => setCollapsed(value => !value)} aria-expanded={!collapsed} aria-label={collapsed ? 'Open look development controls' : 'Collapse look development controls'}>{collapsed ? '＋' : '-'}</button>
    </header>
    {!collapsed && <>
      <nav className="lookdev-tabs" aria-label="Control category">
        {['structure', 'board', 'surface', 'light'].map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </nav>
      <div className="lookdev-body">
        {tab === 'structure' && <>
          <p className="lookdev-baseline">Base: current production</p>
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
        {tab === 'board' && <>
          <button className="lookdev-reset-current" onClick={resetCurrent}>Reset felt board</button>
          <p className="lookdev-note">Controls affect the board in this workbench. The same defaults build the enlarged view, and the lower rail stays intentionally heavier than the other three sides.</p>
          <fieldset><legend>Colours</legend>
            <label className="lookdev-color"><span>Frame</span><input type="color" value={`#${boardValues.frameColor}`} onChange={event => updateBoard('frameColor', event.target.value.replace('#', ''))} /><code>#{boardValues.frameColor}</code></label>
            <label className="lookdev-color"><span>Felt</span><input type="color" value={`#${boardValues.feltColor}`} onChange={event => updateBoard('feltColor', event.target.value.replace('#', ''))} /><code>#{boardValues.feltColor}</code></label>
          </fieldset>
          <fieldset><legend>Shape</legend>
            <label className="lookdev-select lookdev-board-profile"><span>Corners</span><select value={boardValues.profile} onChange={event => updateBoard('profile', event.target.value)}><option value="square">Square</option><option value="soft">Soft</option><option value="rounded">Rounded</option></select></label>
            <NumberControl label="Corner radius" value={boardValues.cornerRadius} min={0} max={.08} step={.002} onChange={value => updateBoard('cornerRadius', value)} />
            <NumberControl label="Side border" value={boardValues.sideBorder} min={.012} max={.12} step={.002} onChange={value => updateBoard('sideBorder', value)} />
            <NumberControl label="Top border" value={boardValues.topBorder} min={.012} max={.12} step={.002} onChange={value => updateBoard('topBorder', value)} />
            <NumberControl label="Bottom rail" value={boardValues.bottomBorder} min={.03} max={.2} step={.002} onChange={value => updateBoard('bottomBorder', value)} />
          </fieldset>
          <fieldset><legend>Depth / metres</legend>
            <NumberControl label="Frame depth" value={boardValues.frameDepth} min={.008} max={.08} step={.002} onChange={value => updateBoard('frameDepth', value)} />
            <NumberControl label="Felt depth" value={boardValues.feltDepth} min={.004} max={.04} step={.002} onChange={value => updateBoard('feltDepth', value)} />
            <NumberControl label="Felt recess" value={boardValues.feltInset} min={0} max={.02} step={.001} onChange={value => updateBoard('feltInset', value)} />
            <NumberControl label="Tray projection" value={boardValues.trayProjection} min={.002} max={.05} step={.002} onChange={value => updateBoard('trayProjection', value)} />
            <NumberControl label="Groove lip" value={boardValues.trayLip} min={.002} max={.025} step={.001} onChange={value => updateBoard('trayLip', value)} />
          </fieldset>
        </>}
        {tab === 'surface' && material && <>
          <label className="lookdev-select"><span>Material</span><select value={materialName} onChange={event => setMaterialName(event.target.value)}>{api.materials.map(item => <option key={item.name} value={item.name}>{materialLabels[item.name] || item.name.replaceAll('_', ' ')}</option>)}</select></label>
          <button className="lookdev-reset-current" onClick={resetCurrent}>Reset selected material</button>
          <div className="lookdev-presets"><button onClick={() => applySurfacePreset(.68, 0, 0)}>Soft matte</button><button onClick={() => applySurfacePreset(.46, material.metalness, .08)}>Satin</button><button onClick={() => applySurfacePreset(.25, material.metalness, .22)}>Polished</button></div>
          <label className="lookdev-color"><span>Base colour</span><input type="color" value={`#${material.color}`} onChange={event => updateMaterial('color', event.target.value.replace('#', ''))} /><code>#{material.color}</code></label>
          <NumberControl label="Roughness" value={material.roughness} min={0} max={1} step={.01} onChange={value => updateMaterial('roughness', value)} />
          <NumberControl label="Metalness" value={material.metalness} min={0} max={1} step={.01} onChange={value => updateMaterial('metalness', value)} />
          <NumberControl label="Clearcoat" value={material.clearcoat} min={0} max={1} step={.01} onChange={value => updateMaterial('clearcoat', value)} />
          <NumberControl label="Opacity" value={material.opacity ?? 1} min={.05} max={1} step={.01} onChange={value => updateMaterial('opacity', value)} />
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
      <footer className="lookdev-footer"><span role="status">{message}</span><label className="lookdev-import">Import draft<input type="file" accept="application/json,.json" onChange={importCheckpoint} /></label><button onClick={copy}>Copy</button><button className="lookdev-save" onClick={save}>Save draft</button></footer>
    </>}
  </aside>
}
