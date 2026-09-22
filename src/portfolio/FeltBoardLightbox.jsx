import { useEffect, useRef, useState } from 'react'
import { assetPath } from '../data/assetPath'
import { createFeltBoard, feltBoardDefaults, feltBoardPlacement, findFeltBoardEnvelope } from './feltBoard'

export default function FeltBoardLightbox({ onClose }) {
  const dialog = useRef(null), host = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  useEffect(() => {
    const element = host.current, abort = new AbortController()
    let disposed = false, renderer, source, boardAsset, environment, observer
    function disposeSource() {
      const geometries = new Set(), materials = new Set(), textures = new Set()
      source?.traverse(node => { if (node.geometry) geometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) { materials.add(material); Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) }) } })
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose())
      boardAsset?.dispose(); environment?.dispose()
    }
    async function load() {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
        ])
        const response = await fetch(assetPath('/models/workstation-v003.glb'), { signal:abort.signal })
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
        const camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,10)
        camera.position.copy(center).add(new THREE.Vector3(0,0,2)); camera.lookAt(center)
        function render() {
          if (disposed) return
          const width = element.clientWidth, height = element.clientHeight, aspect = width / height
          const halfH = Math.max(boardSize.y / 2, boardSize.x / aspect / 2) * 1.05
          camera.left = -halfH * aspect; camera.right = halfH * aspect; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix()
          renderer.setSize(width,height,false); renderer.render(scene,camera)
          const min = box.min.clone().project(camera), max = box.max.clone().project(camera)
          element.dataset.boardBounds = JSON.stringify({left:(min.x+1)/2,top:(1-max.y)/2,right:(max.x+1)/2,bottom:(1-min.y)/2})
          element.dataset.boardModel = 'felt'
          element.dataset.state = 'ready'
        }
        observer = new ResizeObserver(render); observer.observe(element); render()
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') setFailed(true)
      }
    }
    load()
    return () => {
      disposed = true; abort.abort(); observer?.disconnect(); disposeSource()
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [])
  function dismissSurround(event) {
    if (event.target === event.currentTarget) { onClose(); return }
    if (event.target.tagName !== 'CANVAS' || !host.current?.dataset.boardBounds) return
    const rect = host.current.getBoundingClientRect(), bounds = JSON.parse(host.current.dataset.boardBounds)
    const x = (event.clientX-rect.left)/rect.width, y = (event.clientY-rect.top)/rect.height
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) onClose()
  }
  return <dialog ref={dialog} className="felt-board-lightbox" aria-labelledby="felt-board-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={dismissSurround}>
    <div className="felt-board-panel">
      <h2 id="felt-board-title" className="sr-only">Felt board</h2>
      <button autoFocus className="back-circle-control felt-board-close" aria-label="Close felt board" onClick={onClose}><span className="close-cross" aria-hidden="true">×</span></button>
      <div ref={host} className="felt-board-canvas" data-state="loading">{failed && <p className="felt-board-error">The felt board could not load. <button onClick={onClose}>Return to the workbench</button></p>}</div>
    </div>
  </dialog>
}
