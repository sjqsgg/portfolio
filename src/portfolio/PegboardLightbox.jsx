import { useEffect, useRef, useState } from 'react'
import { assetPath } from '../data/assetPath'

const boardParts = ['Pegboard_Perforated_21x14', 'HOTSPOT_badge', 'HOTSPOT_map', 'Pegboard_Headphones', 'Badge_Hanger', 'Badge_Peg', 'CV_Rack', 'HOTSPOT_cv']

export default function PegboardLightbox({ onClose }) {
  const dialog = useRef(null), host = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  useEffect(() => {
    const element = host.current, abort = new AbortController()
    let disposed = false, renderer, source, environment, observer
    function disposeSource() {
      const geometries = new Set(), materials = new Set(), textures = new Set()
      source?.traverse(node => { if (node.geometry) geometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) { materials.add(material); Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) }) } })
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose()); environment?.dispose()
    }
    async function load() {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
        ])
        const response = await fetch(assetPath('/models/workstation-v003.glb'), { signal:abort.signal })
        if (!response.ok) throw new Error('Board unavailable')
        source = (await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')).scene
        if (disposed) { disposeSource(); return }
        source.updateMatrixWorld(true)
        renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute('aria-hidden','true'); element.appendChild(renderer.domElement)
        const scene = new THREE.Scene(), board = new THREE.Group()
        for (const name of boardParts) {
          const node = source.getObjectByName(name)
          if (!node) continue
          const copy = node.clone(true)
          node.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale)
          copy.traverse(mesh => { if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true } })
          board.add(copy)
        }
        scene.add(board)
        const studio = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer)
        environment = generator.fromScene(studio,.04); scene.environment = environment.texture; scene.environmentIntensity = .75
        studio.dispose(); generator.dispose()
        const ambient = new THREE.HemisphereLight(0xf4f6f2, 0x444c36, .55)
        const key = new THREE.DirectionalLight(0xfff8ea,3); key.position.set(-3,5,3)
        key.castShadow = true; key.shadow.mapSize.set(2048,2048); key.shadow.normalBias = .001; key.shadow.bias = -.00005
        Object.assign(key.shadow.camera,{left:-1.5,right:1.5,top:1.5,bottom:-1.5,near:.1,far:12})
        scene.add(ambient,key)
        const box = new THREE.Box3().setFromObject(board), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
        const camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,10)
        camera.position.copy(center).add(new THREE.Vector3(0,0,2)); camera.lookAt(center)
        function render() {
          if (disposed) return
          const width = element.clientWidth, height = element.clientHeight, aspect = width / height
          const halfH = Math.max(size.y / 2, size.x / aspect / 2) * 1.04
          camera.left = -halfH * aspect; camera.right = halfH * aspect; camera.top = halfH; camera.bottom = -halfH; camera.updateProjectionMatrix()
          renderer.setSize(width,height,false); renderer.render(scene,camera)
          // Screen bounds distinguish the board from the transparent space around it.
          const min = box.min.clone().project(camera), max = box.max.clone().project(camera)
          element.dataset.boardBounds = JSON.stringify({left:(min.x+1)/2,top:(1-max.y)/2,right:(max.x+1)/2,bottom:(1-min.y)/2})
          element.dataset.state = 'ready'
        }
        observer = new ResizeObserver(render); observer.observe(element); render()
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') setFailed(true)
      }
    }
    load()
    return () => {
      disposed = true; abort.abort(); observer?.disconnect()
      disposeSource()
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
  return <dialog ref={dialog} className="pegboard-lightbox" aria-labelledby="pegboard-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={dismissSurround}>
    <div className="pegboard-panel">
      <h2 id="pegboard-title" className="sr-only">Pegboard</h2>
      <button autoFocus className="back-circle-control pegboard-close" aria-label="Close pegboard" onClick={onClose}><span className="close-cross" aria-hidden="true">×</span></button>
      <div ref={host} className="pegboard-canvas" data-state="loading">{failed && <p className="pegboard-error">The board couldn’t load. <button onClick={onClose}>Return to the workbench</button></p>}</div>
    </div>
  </dialog>
}
