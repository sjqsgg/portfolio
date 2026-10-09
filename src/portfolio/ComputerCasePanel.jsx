import { useEffect, useRef, useState } from 'react'
import { computerMaterialLabels } from './computerCaseControls'

function ColourControl({ name, label, value, onChange }) {
  const [hex, setHex] = useState(value)
  useEffect(() => setHex(value), [value])
  function commit() {
    const next = hex.replace('#', '').trim()
    if (/^[a-f\d]{6}$/i.test(next)) onChange(next.toLowerCase())
    else setHex(value)
  }
  return <div className="case-colour-row">
    <label htmlFor={`case-colour-${name}`}>{label}</label>
    <input id={`case-colour-${name}`} type="color" value={`#${value}`} onChange={event => onChange(event.target.value.slice(1))} />
    <input aria-label={`${label} HEX`} className="case-hex" value={hex} maxLength={7} spellCheck={false} onChange={event => setHex(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { commit(); event.currentTarget.blur() } }} />
  </div>
}

export default function ComputerCasePanel({ api, computer, materials, materialDefaults, onChange, onMaterial, onResetColours, onReset, onExport, Control: control }) {
  const Control = control
  const [partId, setPartId] = useState('gpu')
  const [surface, setSurface] = useState('Computer_case_smoked_glass')
  const layoutSection = useRef(null)
  if (!api.computer || !computer) return <p>当前场景没有可编辑的机箱。</p>
  const parts = api.computer.parts
  const selected = parts.find(part => part.id === partId) || parts[0]
  const values = computer.parts[selected.id]
  const material = { ...materialDefaults[surface], ...materials[surface] }
  const related = parts.filter(part => part.materials.includes(surface))
  const relatedPart = related.find(part => part.id === partId) || related[0]
  function selectSurface(name) {
    setSurface(name)
    const part = parts.find(part => part.materials.includes(name))
    if (part) setPartId(part.id)
  }
  function update(key, value) { onChange(selected.id, { ...values, [key]: value }) }
  const mm = value => Math.round(value * 10) / 10
  return <div className="computer-case-panel">
    <div className="case-view-actions"><button onClick={api.focusComputer}>机箱近景</button><button onClick={api.restoreView}>工作台整体</button></div>
    <details open className="case-section"><summary>机箱配色 · 8 组</summary>
      {Object.entries(computerMaterialLabels).map(([name, label]) => {
        const value = { ...materialDefaults[name], ...materials[name] }
        return <ColourControl key={name} name={name} label={label} value={value.color} onChange={color => onMaterial(name, 'color', color)} />
      })}
      <button className="case-action" onClick={onResetColours}>恢复已确认的机箱配色</button>
      <label className="lookdev-select"><span>材质属性</span><select value={surface} onChange={event => selectSurface(event.target.value)}>{Object.entries(computerMaterialLabels).map(([name, label]) => <option key={name} value={name}>{label}</option>)}</select></label>
      <Control label="粗糙度" value={material.roughness} min={0} max={1} step={.01} onChange={value => onMaterial(surface, 'roughness', value)} />
      <Control label="金属感" value={material.metalness} min={0} max={1} step={.01} onChange={value => onMaterial(surface, 'metalness', value)} />
      <Control label="不透明度" value={material.opacity ?? 1} min={0} max={1} step={.01} onChange={value => onMaterial(surface, 'opacity', value)} />
      <label className="lookdev-select"><span>对应部件</span><select aria-label="材质对应部件" value={relatedPart?.id || ''} onChange={event => setPartId(event.target.value)}>{related.map(part => <option key={part.id} value={part.id}>{part.label}</option>)}</select></label>
      <button className="case-action" onClick={() => {
        if (relatedPart) setPartId(relatedPart.id)
        layoutSection.current.open = true
        layoutSection.current.scrollIntoView({ block: 'start' })
      }}>调整对应部件的尺寸与位置</button>
    </details>
    <details ref={layoutSection} open className="case-section"><summary>机箱部件 · 尺寸与布局</summary>
      <label className="lookdev-select"><span>选择部件</span><select aria-label="机箱部件" value={selected.id} onChange={event => setPartId(event.target.value)}>{parts.map(part => <option key={part.id} value={part.id}>{part.label}</option>)}</select></label>
      <button className="case-action" onClick={() => onReset(selected.id)}>恢复当前部件</button>
      {selected.kind === 'solid' ? <>
        <fieldset><legend>尺寸 / 毫米</legend>{[['widthMm', '宽度'], ['heightMm', '高度'], ['depthMm', '厚度／深度']].map(([key, label]) => <Control key={key} label={label} value={mm(values[key])} min={mm(selected.defaults[key] * .2)} max={mm(selected.defaults[key] * 2.5)} step={.1} onChange={value => update(key, value)} />)}</fieldset>
        <fieldset><legend>位移 / 毫米</legend>{[['xMm', '左右'], ['yMm', '上下'], ['zMm', '前后']].map(([key, label]) => <Control key={key} label={label} value={mm(values[key])} min={-250} max={250} step={1} onChange={value => update(key, value)} />)}</fieldset>
        <fieldset><legend>旋转 / 度</legend>{[['rotationX', '俯仰'], ['rotationY', '转向'], ['rotationZ', '侧倾']].map(([key, label]) => <Control key={key} label={label} value={values[key]} min={-180} max={180} step={1} onChange={value => update(key, value)} />)}</fieldset>
      </> : <>
        <Control label="管线直径" value={values.diameterMm} min={1} max={24} step={.5} onChange={value => update('diameterMm', value)} />
        <fieldset><legend>走线中段偏移 / 毫米</legend>{[['bendXmm', '左右'], ['bendYmm', '上下'], ['bendZmm', '前后']].map(([key, label]) => <Control key={key} label={label} value={values[key]} min={-250} max={250} step={1} onChange={value => update(key, value)} />)}</fieldset>
      </>}
      <p className="lookdev-note">位移相对初始位置。管线两端跟随相连部件，中段可单独调整。</p>
    </details>
    <div className="case-view-actions"><button onClick={() => onReset()}>恢复整个机箱</button><button onClick={onExport}>导出参数</button></div>
  </div>
}
