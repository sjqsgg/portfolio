import { maxObjectScale } from './boardObjectTransforms.js'

// Positions are fractions of the board envelope; base dimensions are metres.
export const boardObjectDefaults = [
  { id:'scratch', type:'scratch', label:'Lucky sevens', x:-.29, y:.13, width:.19, height:.27, depth:.002, rotation:-7, tilt:0, lift:.008, color:'#1763a1', accent:'#8cba46', curl:.002, visible:true, movable:true, text:'', strokes:[] },
  { id:'boarding-pass', type:'ticket', label:'Amsterdam boarding pass', x:.055, y:.20, width:.30, height:.135, depth:.0015, rotation:5, tilt:0, lift:.007, color:'#f2e9d5', accent:'#739fae', curl:.004, visible:true, movable:true, text:'' },
  { id:'keys', type:'keys', label:'Keys to somewhere', x:.34, y:.13, width:.105, height:.245, depth:.008, rotation:-8, tilt:0, lift:.025, color:'#bab7ac', accent:'#b49b59', curl:0, visible:true, movable:true, text:'' },
  { id:'pin-box', type:'pins', label:'Box of pushpins', x:-.28, y:-.352, width:.145, height:.082, depth:.075, rotation:0, tilt:0, lift:0, color:'#aab98a', accent:'#bc7565', pinColor2:'#d0bd76', pinColor3:'#91b39f', lidColor:'#bac8a5', curl:0, visible:true, movable:false, text:'' },
  { id:'note-stack', type:'stack', label:'A stack of notes', x:.24, y:-.399, width:.14, height:.025, depth:.085, rotation:0, tilt:0, lift:.002, color:'#eddda0', accent:'#c3ad6a', curl:.003, visible:true, movable:false, text:'' },
]
export const objectTypes = { scratch:'Scratch card', ticket:'Boarding pass', keys:'Key ring', pins:'Pushpin box', stack:'Note stack', note:'Note', pin:'Pushpin' }
const number = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
const hex = (value, fallback) => /^#[\da-f]{6}$/i.test(value || '') ? value : fallback
export function constrainObject(item) {
  // Use the rotated envelope so dragging and resizing cannot lose a whole item.
  const angle = item.rotation * Math.PI / 180
  const scale = item.scale || 1
  const halfW = (Math.abs(Math.cos(angle))*item.width + Math.abs(Math.sin(angle))*item.height) * scale / .924 / 2
  const halfH = (Math.abs(Math.sin(angle))*item.width + Math.abs(Math.cos(angle))*item.height) * scale / .616 / 2
  return { ...item, x:number(item.x,0,-Math.max(0,.47-halfW),Math.max(0,.47-halfW)), y:number(item.y,0,-Math.max(0,.47-halfH),Math.max(0,.47-halfH)) }
}
export function normalizeObjects(input) {
  if (!Array.isArray(input) || input.length > 40) throw new Error('Choose a layout with at most 40 objects.')
  const ids = new Set()
  return input.map(raw => {
    if (!raw || !Object.hasOwn(objectTypes,raw.type) || typeof raw.id !== 'string' || !raw.id || ids.has(raw.id) || raw.id.length > 80) throw new Error('Invalid object in layout.')
    ids.add(raw.id)
    const base = boardObjectDefaults.find(item => item.type===raw.type) || boardObjectDefaults[0]
    const strokes = Array.isArray(raw.strokes) ? raw.strokes.slice(0,2000).map(p => {
      if (!Array.isArray(p) || p.length!==4 || p.some(v=>!Number.isFinite(v))) throw new Error('Invalid scratch marks.')
      return p.map(v=>number(v,0,0,1))
    }) : []
    const item = { id:raw.id, type:raw.type, label:String(raw.label || objectTypes[raw.type]).slice(0,60),
      x:number(raw.x,base.x,-.5,.5), y:number(raw.y,base.y,-.5,.5), width:number(raw.width,base.width,.008,.40), height:number(raw.height,base.height,.008,.34),
      depth:number(raw.depth,base.depth,.001,.1), rotation:number(raw.rotation,0,-180,180), tilt:number(raw.tilt,0,-35,35), lift:number(raw.lift,.008,0,.1),
      color:hex(raw.color,base.color), accent:hex(raw.accent,base.accent), curl:number(raw.curl,0,0,.02), visible:raw.visible!==false, movable:raw.movable!==false,
      detailScale:number(raw.detailScale,1,.4,2),
      scale:number(raw.scale,1,.1,3), lockAspect:raw.lockAspect!==false,
      lidColor:hex(raw.lidColor,base.lidColor || base.color), pinColor2:hex(raw.pinColor2,base.pinColor2 || base.accent), pinColor3:hex(raw.pinColor3,base.pinColor3 || base.accent),
      text:String(raw.text || '').slice(0,180), strokes,
    }
    item.scale=Math.min(item.scale,maxObjectScale(item))
    return constrainObject(item)
  })
}
export const boardEditorEnabled = () => import.meta.env.DEV && /(?:[?&])(?:lookdev|boardedit)=1(?:&|$)/.test(window.location.search)
const storageKey = () => boardEditorEnabled() ? 'jiaqi-board-objects-owner-v1' : 'jiaqi-board-objects-visitor-v1'
let snapshot
const listeners = new Set()
export function getBoardObjects() {
  if (!snapshot) {
    try {
      const saved=JSON.parse(localStorage.getItem(storageKey()))
      const draft=saved?.objects?.map(item=>{
        // Upgrade only the untouched old procedural box, preserving user edits.
        if(item.type==='pins'&&item.width===.135&&item.height===.035&&item.depth===.055&&item.color==='#d88b75'&&item.accent==='#ba4245') {
          const current=boardObjectDefaults.find(i=>i.type==='pins')
          return {...item,width:current.width,height:current.height,depth:current.depth,color:current.color,accent:current.accent,lift:current.lift,y:item.y+(current.height-item.height)/(.616*2)}
        }
        return item
      })
      snapshot=normalizeObjects(draft || boardObjectDefaults)
    }
    catch { snapshot=normalizeObjects(boardObjectDefaults) }
  }
  return snapshot
}
export function subscribeBoardObjects(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function replaceBoardObjects(items) {
  snapshot=normalizeObjects(items)
  listeners.forEach(listener=>listener())
}
export function patchBoardObject(id, values) { replaceBoardObjects(getBoardObjects().map(item=>item.id===id ? {...item,...values} : item)) }
export function saveBoardObjects() {
  localStorage.setItem(storageKey(),JSON.stringify({version:1,objects:getBoardObjects()}))
}
export function resetBoardObjects() { replaceBoardObjects(boardObjectDefaults); saveBoardObjects() }
export function addBoardObject(type, values={}) {
  if (getBoardObjects().length>=40) throw new Error('The board is full (40 objects).')
  const base=boardObjectDefaults.find(item=>item.type===type) || boardObjectDefaults[0]
  const id=`${type}-${crypto.randomUUID()}`
  replaceBoardObjects([...getBoardObjects(), {...base,id,type,label:objectTypes[type],strokes:[],...values}])
  return id
}
