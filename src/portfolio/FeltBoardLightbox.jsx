import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { assetPath } from '../data/assetPath'
import { createFeltBoard, feltBoardDefaults, feltBoardPlacement, findFeltBoardEnvelope } from './feltBoard'
import { createBoardObjects } from './boardObjects'
import { loadBoardPinModel } from './boardPinModel'
import { maxObjectScale, scaleBoardObject, resizeBoardObject } from './boardObjectTransforms'
import { boardEditorEnabled, getBoardObjects, subscribeBoardObjects, patchBoardObject, addBoardObject, replaceBoardObjects, saveBoardObjects, resetBoardObjects } from './boardObjectsStore'
import './boardObjects.css'

export default function FeltBoardLightbox({ onClose }) {
  const dialog = useRef(null), host = useRef(null), selectionBox=useRef(null), sceneControls=useRef(null)
  const [failed, setFailed] = useState(false)
  const items=useSyncExternalStore(subscribeBoardObjects,getBoardObjects)
  const [selected,setSelected]=useState('scratch'), [mode,setMode]=useState(()=>boardEditorEnabled()?'arrange':'interact'), [message,setMessage]=useState(''), [text,setText]=useState(''), [writing,setWriting]=useState(false)
  const [layoutText,setLayoutText]=useState(''), [showJSON,setShowJSON]=useState(false)
  const editor=boardEditorEnabled(), active=items.find(i=>i.id===selected)
  const interaction=useRef({mode,editor}), dragged=useRef(false)
  function persist(){try{saveBoardObjects();setMessage('Saved in this browser.')}catch{setMessage('Browser storage unavailable. Export your layout to keep it.')}}
  function change(values){patchBoardObject(selected,values);persist()}
  function changeDimension(key,value){if(active.lockAspect)change(scaleBoardObject(active,value/(active[key]*active.scale)));else change({[key]:value/active.scale})}
  function importLayout(content){const data=JSON.parse(content);if(data.version!==1)throw new Error('Unsupported layout version.');replaceBoardObjects(data.objects);setSelected(getBoardObjects()[0]?.id||'');persist()}
  function takeNote(){setWriting(true);setMessage('Write a note, then pin it to the board. Only this browser will see it.')}
  function takePin(){try{setSelected(addBoardObject('pin',{width:.016,height:.018,depth:.025,color:'#bc4948',x:.05,y:-.05,movable:true}));persist()}catch(error){setMessage(error.message)}}
  interaction.current={mode,editor,selected,takePin,takeNote,persist}
  useEffect(()=>{sceneControls.current?.refresh()},[selected,mode,items])
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  useEffect(() => {
    const element = host.current, abort = new AbortController()
    let disposed = false, renderer, source, boardAsset, environment, observer, objects, unsubscribe, frame, removeEvents
    function disposeSource() {
      const geometries = new Set(), materials = new Set(), textures = new Set()
      source?.traverse(node => { if (node.geometry) geometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) { materials.add(material); Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) }) } })
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose())
      objects?.dispose(); boardAsset?.dispose(); environment?.dispose()
    }
    async function load() {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
        ])
        const [response,pinModel] = await Promise.all([fetch(assetPath('/models/workstation-v003.glb'), { signal:abort.signal }),loadBoardPinModel()])
        if (!response.ok) throw new Error('Felt board unavailable')
        source = (await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')).scene
        if (disposed) { disposeSource(); return }
        source.updateMatrixWorld(true)
        const anchor = findFeltBoardEnvelope(source)
        if (!anchor?.geometry) throw new Error('Felt board anchor unavailable')
        anchor.geometry.computeBoundingBox()
        const size = anchor.geometry.boundingBox.getSize(new THREE.Vector3())
        const localCenter = anchor.geometry.boundingBox.getCenter(new THREE.Vector3())
        boardAsset = createFeltBoard(THREE, size, feltBoardDefaults)
        boardAsset.frame.position.copy(localCenter)
        boardAsset.felt.position.copy(localCenter)
        anchor.matrixWorld.decompose(boardAsset.assembly.position, boardAsset.assembly.quaternion, boardAsset.assembly.scale)
        boardAsset.assembly.scale.multiply(new THREE.Vector3(feltBoardPlacement.scaleX, feltBoardPlacement.scaleY, feltBoardPlacement.scaleZ))
        boardAsset.assembly.position.add(new THREE.Vector3(feltBoardPlacement.positionX, feltBoardPlacement.positionY, feltBoardPlacement.positionZ))

        renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute('aria-hidden','true'); element.appendChild(renderer.domElement)
        const scene = new THREE.Scene()
        scene.add(boardAsset.assembly)
        const studio = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer)
        environment = generator.fromScene(studio,.04); scene.environment = environment.texture; scene.environmentIntensity = .75
        studio.dispose(); generator.dispose()
        const ambient = new THREE.HemisphereLight(0xf4f6f2, 0x443b34, .62)
        const key = new THREE.DirectionalLight(0xfff8ea,3); key.position.set(-3,5,3)
        key.castShadow = true; key.shadow.mapSize.set(2048,2048); key.shadow.normalBias = .001; key.shadow.bias = -.00005
        Object.assign(key.shadow.camera,{left:-1.5,right:1.5,top:1.5,bottom:-1.5,near:.1,far:12})
        scene.add(ambient,key)
        const box = new THREE.Box3().setFromObject(boardAsset.assembly), center = box.getCenter(new THREE.Vector3()), boardSize = box.getSize(new THREE.Vector3())
        objects=createBoardObjects(THREE,size,pinModel);objects.group.position.copy(localCenter);boardAsset.assembly.add(objects.group);objects.setItems(getBoardObjects())
        const camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,10)
        camera.position.copy(center).add(new THREE.Vector3(0,.16,2)); camera.lookAt(center)
        function render() {
          if (disposed) return
          const width = element.clientWidth, height = element.clientHeight, aspect = width / height
          const halfH = Math.max(boardSize.y / 2, boardSize.x / aspect / 2) * 1.05
          camera.left = -halfH * aspect; camera.right = halfH * aspect; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix()
          renderer.setSize(width,height,false); renderer.render(scene,camera)
          const selection=selectionBox.current, record=objects.get(interaction.current.selected)
          if(selection) {
            selection.hidden=!(interaction.current.mode==='arrange'&&record?.root.visible)
            if(!selection.hidden) {
              const objectBounds=new THREE.Box3().setFromObject(record.root), pixels=[]
              for(const x of [objectBounds.min.x,objectBounds.max.x])for(const y of [objectBounds.min.y,objectBounds.max.y])for(const z of [objectBounds.min.z,objectBounds.max.z]){
                const point=new THREE.Vector3(x,y,z).project(camera);pixels.push([(point.x+1)*width/2,(1-point.y)*height/2])
              }
              const left=Math.min(...pixels.map(p=>p[0]))-7,top=Math.min(...pixels.map(p=>p[1]))-7
              Object.assign(selection.style,{left:`${left}px`,top:`${top}px`,width:`${Math.max(...pixels.map(p=>p[0]))-left+7}px`,height:`${Math.max(...pixels.map(p=>p[1]))-top+7}px`})
            }
          }
          const min = box.min.clone().project(camera), max = box.max.clone().project(camera)
          element.dataset.boardBounds = JSON.stringify({left:(min.x+1)/2,top:(1-max.y)/2,right:(max.x+1)/2,bottom:(1-min.y)/2})
          element.dataset.boardModel = 'felt'
          element.dataset.state = 'ready'
        }
        observer = new ResizeObserver(render); observer.observe(element); render()
        unsubscribe=subscribeBoardObjects(()=>{objects.setItems(getBoardObjects());render()})
        const canvas=renderer.domElement, ray=new THREE.Raycaster(), pointer=new THREE.Vector2()
        let drag, sway, resizing
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
        function animate(time){objects.animate(time,sway);render();if(sway&&time-sway.start<2300&&!disposed)frame=requestAnimationFrame(animate)}
        function cast(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObject(objects.group,true)}
        function localPoint(event){cast(event);const normal=new THREE.Vector3(0,0,1).applyQuaternion(boardAsset.assembly.getWorldQuaternion(new THREE.Quaternion()));const point=boardAsset.assembly.localToWorld(new THREE.Vector3(0,0,.04));const world=ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point),new THREE.Vector3());return world?boardAsset.assembly.worldToLocal(world):null}
        const fraction=event=>{const p=localPoint(event);return p?{x:p.x/size.x,y:p.y/size.y}:null}
        sceneControls.current={refresh:render,
          beginResize(event,corner){
            if(event.button!==0||drag||resizing)return
            const item=getBoardObjects().find(i=>i.id===interaction.current.selected), record=objects.get(item?.id), rect=selectionBox.current?.getBoundingClientRect()
            if(!record||!rect)return
            event.preventDefault();event.stopPropagation();dragged.current=true
            const start=fraction(event), anchor=fraction({clientX:corner.includes('left')?rect.right:rect.left,clientY:corner.includes('top')?rect.bottom:rect.top})
            if(!start||!anchor)return
            resizing={id:item.id,item,start,anchor,pointer:event.pointerId,scale:record.root.scale.clone(),position:record.root.position.clone(),values:{}}
            event.currentTarget.setPointerCapture(event.pointerId)
          },
          resize(event){
            if(!resizing||resizing.pointer!==event.pointerId)return
            event.preventDefault();event.stopPropagation();dragged.current=true
            const p=fraction(event);if(!p)return
            const values=resizeBoardObject(resizing.item,resizing.start,p,resizing.anchor,resizing.item.lockAspect), record=objects.get(resizing.id)
            resizing.values=values
            record.root.scale.copy(resizing.scale)
            if(resizing.item.lockAspect)record.root.scale.multiplyScalar(values.scale/resizing.item.scale)
            else {record.root.scale.x*=values.width/resizing.item.width;record.root.scale.y*=values.height/resizing.item.height}
            record.root.position.x=values.x*size.x;record.root.position.y=values.y*size.y
            render()
          },
          endResize(event){
            if(!resizing||resizing.pointer!==event.pointerId)return
            event.preventDefault();event.stopPropagation();dragged.current=true
            const current=resizing;resizing=null
            if(event.type==='pointercancel'){const record=objects.get(current.id);record.root.scale.copy(current.scale);record.root.position.copy(current.position);render()}
            else{patchBoardObject(current.id,current.values);interaction.current.persist()}
            if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
          },
        }
        function down(event){
          if(event.button!==0||drag||resizing)return
          dragged.current=false
          const hit=cast(event)[0];if(!hit)return
          let node=hit.object;while(node&&!node.userData.itemId)node=node.parent
          const item=getBoardObjects().find(i=>i.id===node?.userData.itemId);if(!item)return
          setSelected(item.id)
          if(interaction.current.mode==='interact'&&item.type==='stack'){interaction.current.takeNote();return}
          if(interaction.current.mode==='interact'&&item.type==='pins'){interaction.current.takePin();return}
          const scratch=interaction.current.mode==='interact'&&item.type==='scratch'
          if(!scratch&&!item.movable&&!interaction.current.editor)return
          drag={id:item.id,item,point:localPoint(event),scratch,previous:null,strokes:[...item.strokes],pointer:event.pointerId}
          canvas.setPointerCapture(event.pointerId)
          if(item.type==='keys'&&!reduced){sway={id:item.id,start:performance.now()};cancelAnimationFrame(frame);frame=requestAnimationFrame(animate)}
          move(event)
        }
        function move(event){
          if(!drag||drag.pointer!==event.pointerId)return
          dragged.current=true
          const r=objects.get(drag.id)
          if(drag.scratch){
            const hit=cast(event).find(h=>h.object.userData.scratch&&h.object.parent===r.root)
            if(!hit){drag.previous=null;return}
            const p=[hit.uv.x,hit.uv.y],prev=drag.previous||p,stroke=[...prev,...p]
            if(drag.strokes.length<2000){r.scratch(stroke);drag.strokes.push(stroke)}drag.previous=p;render()
          }else{const p=localPoint(event);if(!p||!drag.point)return;r.root.position.x=drag.item.x*size.x+p.x-drag.point.x;r.root.position.y=drag.item.y*size.y+p.y-drag.point.y;render()}
        }
        function up(event){
          if(!drag||drag.pointer!==event.pointerId)return
          const r=objects.get(drag.id), current=drag;drag=null
          if(event.type==='pointercancel'){objects.setItems([]);objects.setItems(getBoardObjects());render();return}
          patchBoardObject(current.id,current.scratch?{strokes:current.strokes}:{x:r.root.position.x/size.x,y:r.root.position.y/size.y})
          interaction.current.persist();if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId)
        }
        canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up)
        removeEvents=()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)}
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') setFailed(true)
      }
    }
    load()
    return () => {
      disposed = true; abort.abort(); observer?.disconnect(); unsubscribe?.();removeEvents?.();cancelAnimationFrame(frame);sceneControls.current=null;disposeSource()
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [])
  function dismissSurround(event) {
    if(dragged.current){dragged.current=false;return}
    if (event.target === event.currentTarget) { onClose(); return }
    if (event.target.tagName !== 'CANVAS' || !host.current?.dataset.boardBounds || mode==='arrange') return
    const rect = host.current.getBoundingClientRect(), bounds = JSON.parse(host.current.dataset.boardBounds)
    const x = (event.clientX-rect.left)/rect.width, y = (event.clientY-rect.top)/rect.height
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) onClose()
  }
  return <dialog ref={dialog} className={`felt-board-lightbox board-objects-dialog ${editor?'is-editor':''}`} aria-labelledby="felt-board-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={dismissSurround}>
    <div className="felt-board-panel">
      <h2 id="felt-board-title" className="sr-only">Felt board</h2>
      <button autoFocus className="back-circle-control felt-board-close" aria-label="Close felt board" onClick={onClose}><span className="close-cross" aria-hidden="true">×</span></button>
      <div ref={host} className="felt-board-canvas" data-state="loading">
        {editor&&<div ref={selectionBox} className="board-selection" hidden aria-label="Selected object bounds">{['top-left','top-right','bottom-left','bottom-right'].map(corner=><button key={corner} type="button" className={`board-resize-handle ${corner}`} aria-label={`Resize ${active?.label || 'object'} from ${corner.replace('-',' ')}`} title="Drag to resize; arrow keys resize in 5% steps" onPointerDown={e=>sceneControls.current?.beginResize(e,corner)} onPointerMove={e=>sceneControls.current?.resize(e)} onPointerUp={e=>sceneControls.current?.endResize(e)} onPointerCancel={e=>sceneControls.current?.endResize(e)} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(!active||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();change(scaleBoardObject(active,['ArrowUp','ArrowRight'].includes(e.key)?1.05:1/1.05))}}/>)}</div>}
        {failed && <p className="felt-board-error">The felt board could not load. <button onClick={onClose}>Return to the workbench</button></p>}
      </div>
      <section className="board-tools" aria-label="Board controls">
        <header><strong>A few things collected along the way.</strong><span>Move something. Leave a little note.</span></header>
        <div className="board-actions"><button aria-pressed={mode==='interact'} onClick={()=>setMode('interact')}>Interact</button><button aria-pressed={mode==='arrange'} onClick={()=>setMode('arrange')}>Arrange</button><button onClick={takeNote}>Take a note</button><button onClick={takePin}>Take a pin</button><button onClick={()=>{try{resetBoardObjects();setSelected('scratch');setMessage('Original layout restored.')}catch{setMessage('Reset in memory; browser storage unavailable.')}}}>Reset layout</button></div>
        <p className="board-hint">{mode==='interact'?'Drag across the silver card to scratch. Pick up the keys to give them a little sway.':editor?'Click an object to select it. Drag inside to move; drag a corner to resize.':'Drag an object to move it. Or select it below and use the arrow buttons.'} Changes stay in this browser.</p>
        <label>Selected object<select value={active?.id||''} onChange={e=>setSelected(e.target.value)}>{!active&&<option value="">Choose an object</option>}{items.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {active&&(active.movable||editor)&&<div className="board-actions" aria-label="Move selected object">{[['←',-.02,0],['→',.02,0],['↑',0,.02],['↓',0,-.02]].map(([label,x,y])=><button key={label} aria-label={`Move ${label}`} onClick={()=>change({x:active.x+x,y:active.y+y})}>{label}</button>)}</div>}
        {active?.type==='scratch'&&<div className="board-actions"><button onClick={()=>change({strokes:[]})}>Recoat card</button><button onClick={()=>change({strokes:Array.from({length:35},(_,i)=>[.42,.17+i*.02,.95,.17+i*.02])})}>Reveal card (keyboard)</button></div>}
        {writing&&<form onSubmit={e=>{e.preventDefault();if(!text.trim())return;try{setSelected(addBoardObject('note',{label:'Visitor note',text:text.trim(),x:.03,y:-.12,width:.145,height:.145,depth:.001,color:'#eddda0',accent:'#c75b64',curl:.005,rotation:-4}));setWriting(false);setText('');persist()}catch(error){setMessage(error.message)}}}><label>Your note<textarea autoFocus maxLength={180} value={text} onChange={e=>setText(e.target.value)} required /></label><button type="submit">Pin note</button><button type="button" onClick={()=>setWriting(false)}>Cancel</button></form>}
        {editor&&active&&<details open className="board-inspector"><summary>Object studio</summary>
          <label><input type="checkbox" checked={active.lockAspect} onChange={e=>change({lockAspect:e.target.checked})}/>Lock proportions</label>
          <label>Scale (%)<input type="number" min="10" max={Math.floor(maxObjectScale(active)*100)} step="5" value={Math.round(active.scale*1000)/10} onChange={e=>{if(e.target.value!=='')change(scaleBoardObject(active,Number(e.target.value)/(active.scale*100)))}}/></label>
          <div className="board-actions"><button onClick={()=>change(scaleBoardObject(active,1/1.1))}>Smaller</button><button onClick={()=>change(scaleBoardObject(active,1.1))}>Larger</button></div>
          <label>Name<input value={active.label} maxLength={60} onChange={e=>change({label:e.target.value})}/></label>
          {['x','y','width','height','depth','rotation','tilt','lift','curl'].map(key=>{const dimension=['width','height','depth'].includes(key);return <label key={key}>{({x:'Horizontal position',y:'Vertical position',lift:'Distance from board',curl:'Paper curl'})[key]||key}<input type="number" step={key==='rotation'||key==='tilt'?1:.001} value={Math.round(active[key]*(dimension?active.scale:1)*1000000)/1000000} onChange={e=>{if(e.target.value==='')return;const value=Number(e.target.value);if(dimension)changeDimension(key,value);else change({[key]:value})}}/></label>})}
          {(active.type==='pins'?['color','lidColor','accent','pinColor2','pinColor3']:['color','accent']).map(key=><label key={key}>{active.type==='pins'?({color:'Box color',lidColor:'Lid color',accent:'Pin color 1',pinColor2:'Pin color 2',pinColor3:'Pin color 3'})[key]:key}<input type="color" value={active[key]} onInput={e=>change({[key]:e.currentTarget.value})} onChange={e=>change({[key]:e.target.value})}/></label>)}
          {!['stack','pin'].includes(active.type)&&<label>{active.type==='keys'?'Key spread':'Pushpin size'}<input type="range" min="0.4" max="2" step="0.05" value={active.detailScale} onChange={e=>change({detailScale:Number(e.target.value)})}/></label>}
          {active.type==='note'&&<label>Note text<textarea maxLength={180} value={active.text} onChange={e=>change({text:e.target.value})}/></label>}
          <label><input type="checkbox" checked={active.visible} onChange={e=>change({visible:e.target.checked})}/>Visible</label><label><input type="checkbox" checked={active.movable} onChange={e=>change({movable:e.target.checked})}/>Visitors may move</label>
          <div className="board-actions"><button onClick={()=>{try{const {id:_,...copy}=active;setSelected(addBoardObject(active.type,{...copy,label:active.label+' copy',x:active.x+.03,y:active.y-.03}));persist()}catch(error){setMessage(error.message)}}}>Duplicate</button><button onClick={()=>{replaceBoardObjects(items.filter(i=>i.id!==selected));setSelected(items.find(i=>i.id!==selected)?.id||'');persist()}}>Remove</button></div>
        </details>}
        {editor&&<div className="board-actions"><button onClick={()=>{setLayoutText(JSON.stringify({version:1,objects:items},null,2));setShowJSON(true)}}>Export layout</button><button onClick={()=>{setLayoutText('');setShowJSON(true)}}>Paste layout JSON</button><label className="board-import">Import layout<input type="file" accept="application/json" onChange={async e=>{const input=e.currentTarget;try{const file=input.files?.[0];if(!file)return;if(file.size>2000000)throw new Error('Layout file is too large.');importLayout(await file.text())}catch(error){setMessage(error.message)}input.value=''}}/></label></div>}
        {editor&&showJSON&&<div><label>Layout JSON<textarea value={layoutText} maxLength={2000000} onChange={e=>setLayoutText(e.target.value)} /></label><div className="board-actions"><a download="felt-board-layout.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(layoutText)}`}>Download JSON</a><button onClick={()=>{try{importLayout(layoutText);setShowJSON(false)}catch(error){setMessage(error.message)}}}>Apply JSON</button><button onClick={()=>setShowJSON(false)}>Close JSON</button></div></div>}
        <p role="status">{message}</p>
      </section>
    </div>
  </dialog>
}
