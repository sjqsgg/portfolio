import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sceneViews, hotspotNodes } from './sceneViews'
import { assetPath } from '../data/assetPath'

export default function Workbench({ theme, toggleTheme, openCamera, onStatus, home, view, object, onView, onInspect, onBoard, resetKey }) {
  const host = useRef(null), controller = useRef(null)
  const navigate = useNavigate()
  const latest = useRef({})
  latest.current = { theme, view, object, toggleTheme, openCamera, onView, onInspect, onBoard }
  useEffect(() => { controller.current?.setTheme(theme) }, [theme])
  useEffect(() => { controller.current?.compose(view, object) }, [view, object, resetKey])
  useEffect(() => {
    const element = host.current, homeElement = home.current, abort = new AbortController()
    let disposed = false, renderer, scene, model, observer, controls, environment, frame = 0, prepared = false
    const cleanups = []
    function disposeObject(root) {
      const geometries = new Set(), materials = new Set(), textures = new Set()
      root?.traverse(node => {
        if (node.geometry) geometries.add(node.geometry)
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) if (material) {
          materials.add(material)
          Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) })
        }
      })
      textures.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); geometries.forEach(x => x.dispose())
    }
    const fail = () => { if (!disposed) { element.dataset.state = 'error'; onStatus('error') } }
    const timer = setTimeout(() => { abort.abort(); fail() }, 25000)
    onStatus('loading')
    async function start() {
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/controls/OrbitControls.js'), import('three/addons/environments/RoomEnvironment.js'),
        ])
        if (disposed || abort.signal.aborted) return
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap
        renderer.domElement.setAttribute('aria-hidden', 'true'); element.appendChild(renderer.domElement)
        const contextLost = event => { event.preventDefault(); fail() }
        renderer.domElement.addEventListener('webglcontextlost', contextLost)
        cleanups.push(() => renderer.domElement.removeEventListener('webglcontextlost', contextLost))
        const response = await fetch(assetPath('/models/workstation-v003.glb'), { signal: abort.signal })
        if (!response.ok) throw new Error('Model unavailable')
        const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')
        model = gltf.scene
        if (disposed || abort.signal.aborted) { disposeObject(model); return }
        scene = new THREE.Scene()
        const studio = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer)
        environment = generator.fromScene(studio, .04); scene.environment = environment.texture
        studio.dispose(); generator.dispose()
        // A deterministic microsurface shared by leather and woven speaker cloth.
        const grain = new Uint8Array(128 * 128 * 4)
        let seed = 37
        for (let i = 0; i < grain.length; i += 4) {
          seed = (seed * 1664525 + 1013904223) >>> 0
          const value = 90 + (seed % 110)
          grain[i] = grain[i+1] = grain[i+2] = value; grain[i+3] = 255
        }
        const texture = new THREE.DataTexture(grain, 128, 128)
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(12, 12); texture.needsUpdate = true
        model.traverse(node => {
          if (!node.isMesh) return
          node.castShadow = true; node.receiveShadow = true
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
            if (['Camera_leather', 'Speaker_cloth'].includes(material.name)) { material.bumpMap = texture; material.bumpScale = .0006 }
            if (material.name === 'Pale_ash') material.roughness = .57
          }
        })
        scene.add(model); model.updateMatrixWorld(true)
        const ambient = new THREE.HemisphereLight(0xf4f6f2, 0x444c36, .85)
        const key = new THREE.DirectionalLight(0xfff8ea, 3)
        key.position.set(-3, 5, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.blurSamples = 8
        Object.assign(key.shadow.camera, { left: -2.3, right: 2.3, top: 2.5, bottom: -2, near: .1, far: 12 })
        key.shadow.normalBias = .002; key.shadow.bias = -.00005
        const fill = new THREE.DirectionalLight(0xdae8f1, .65); fill.position.set(3, 2, -2)
        const practical = new THREE.PointLight(0xffd092, 0, 2.6, 2)
        model.getObjectByName('Lamp_Diffuser').getWorldPosition(practical.position); practical.position.y -= .014
        scene.add(ambient, key, fill, practical)
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .16 }))
        floor.rotation.x = -Math.PI/2; floor.position.y = -.004; floor.receiveShadow = true; scene.add(floor)
        const camera = new THREE.PerspectiveCamera(29, 1, .03, 30)
        const initial = sceneViews[latest.current.view]
        camera.position.fromArray(initial.position)
        controls = new OrbitControls(camera, renderer.domElement)
        controls.target.fromArray(initial.target); controls.enableZoom = true; controls.enablePan = true
        controls.minDistance = .2; controls.maxDistance = 20
        controls.enableDamping = false; controls.rotateSpeed = .65; controls.update()
        renderer.domElement.style.touchAction = 'none'
        // Keep browser pinch/zoom inside the scene. Native zoom elsewhere remains available.
        const consumeWheel = event => event.preventDefault()
        renderer.domElement.addEventListener('wheel', consumeWheel, { passive: false })
        let gestureScale = 1
        const consumeGesture = event => {
          event.preventDefault()
          if (event.type === 'gesturestart') gestureScale = event.scale || 1
          if (event.type === 'gesturechange' && controls.enabled && event.scale > 0) {
            const offset = camera.position.clone().sub(controls.target)
            const distance = THREE.MathUtils.clamp(offset.length() * gestureScale / event.scale, controls.minDistance, controls.maxDistance)
            camera.position.copy(controls.target).add(offset.setLength(distance))
            controls.update(); render()
            gestureScale = event.scale
          }
        }
        for (const type of ['gesturestart', 'gesturechange', 'gestureend']) renderer.domElement.addEventListener(type, consumeGesture, { passive: false })
        cleanups.push(() => {
          renderer.domElement.removeEventListener('wheel', consumeWheel)
          for (const type of ['gesturestart', 'gesturechange', 'gestureend']) renderer.domElement.removeEventListener(type, consumeGesture)
        })
        const poses = ['cv', 'badge', 'guestbook'].map(id => {
          const node = model.getObjectByName(hotspotNodes[id])
          return { id, node, position: node.position.clone(), quaternion: node.quaternion.clone() }
        })
        let transition = null
        const ease = t => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2
        function enableOrbit() {
          controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity
          controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI
          controls.enabled = !latest.current.object
        }
        enableOrbit()
        function fovFor(id) { return homeElement.clientWidth < 768 ? sceneViews[id].mobileFov : sceneViews[id].fov }
        function compose(id, selected) {
          const spec = sceneViews[id], mobile = homeElement.clientWidth < 768
          const position = mobile && spec.mobilePosition ? spec.mobilePosition : spec.position
          const target = mobile && spec.mobileTarget ? spec.mobileTarget : spec.target
          controls.enabled = false
          controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity
          controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI
          transition = {
            start: performance.now(), duration: selected ? 1800 : 2150,
            from: camera.position.clone(), to: new THREE.Vector3(...position),
            fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(...target),
            fromFov: camera.fov, toFov: fovFor(id),
            fromOffset: [camera.view?.offsetX || 0, camera.view?.offsetY || 0],
            toOffset: [0, 0],
            poses: poses.map(pose => {
              const position = pose.position.clone(), quaternion = pose.quaternion.clone()
              if (pose.id === selected) {
                position.y += pose.id === 'guestbook' ? .22 : .16
                position.z += pose.id === 'cv' ? .18 : .26
                const spin = pose.id === 'badge' ? Math.PI*2 + .18 : -.16
                quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.id === 'guestbook' ? -.35 : 0, spin, -.08)))
              }
              return { ...pose, from: pose.node.position.clone(), fromQ: pose.node.quaternion.clone(), to: position, toQ: quaternion, flip: pose.id === 'badge' && selected === 'badge' }
            }),
          }
          element.dataset.moving = 'true'; fit(); render()
        }
        function projectLabels() {
          const canvasBox = element.getBoundingClientRect(), box = homeElement.getBoundingClientRect()
          homeElement.querySelectorAll('[data-anchor]').forEach(label => {
            const node = model.getObjectByName(hotspotNodes[label.dataset.anchor])
            if (!node) return
            const bounds = new THREE.Box3().setFromObject(node)
            const point = bounds.getCenter(new THREE.Vector3()).project(camera)
            const x = canvasBox.left - box.left + (point.x+1)/2*canvasBox.width
            const y = canvasBox.top - box.top + (1-point.y)/2*canvasBox.height
            const corners = []
            for (const px of [bounds.min.x,bounds.max.x]) for (const py of [bounds.min.y,bounds.max.y]) for (const pz of [bounds.min.z,bounds.max.z]) corners.push(new THREE.Vector3(px,py,pz).project(camera))
            const width = Math.max(32, (Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)))/2*canvasBox.width)
            const height = Math.max(32, (Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y)))/2*canvasBox.height)
            label.style.setProperty('--anchor-x', `${x}px`); label.style.setProperty('--anchor-y', `${y}px`)
            label.style.setProperty('--anchor-width', `${width}px`); label.style.setProperty('--anchor-height', `${height}px`)
            label.dataset.meshX = String(canvasBox.left + (point.x+1)/2*canvasBox.width)
            label.dataset.meshY = String(canvasBox.top + (1-point.y)/2*canvasBox.height)
            label.style.visibility = point.z > 1 ? 'hidden' : ''
            label.style.opacity = transition || latest.current.object ? '0' : ''
          })
        }

        function tick(now) {
          frame = 0
          if (disposed || !prepared) return
          if (transition) {
            const t = Math.min(1, (now-transition.start)/transition.duration), e = ease(t)
            camera.position.lerpVectors(transition.from, transition.to, e)
            controls.target.lerpVectors(transition.fromTarget, transition.toTarget, e)
            camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, e)
            camera.setViewOffset(element.clientWidth, element.clientHeight, THREE.MathUtils.lerp(transition.fromOffset[0], transition.toOffset[0], e), THREE.MathUtils.lerp(transition.fromOffset[1], transition.toOffset[1], e), element.clientWidth, element.clientHeight)
            camera.updateProjectionMatrix()
            for (const pose of transition.poses) {
              pose.node.position.lerpVectors(pose.from, pose.to, e)
              pose.node.quaternion.slerpQuaternions(pose.fromQ, pose.toQ, e)
              if (pose.flip && t < 1) pose.node.rotateY(Math.sin(t*Math.PI)*Math.PI)
            }
            controls.update()
            if (t === 1) { transition = null; enableOrbit(); element.dataset.moving = 'false' }
          }
          element.dataset.cameraPosition = camera.position.toArray().join(',')
          element.dataset.cameraTarget = controls.target.toArray().join(',')
          element.dataset.cameraDistance = String(camera.position.distanceTo(controls.target))
          model.updateMatrixWorld(true); renderer.render(scene, camera); projectLabels()
          if (transition) render()
        }
        function render() { if (!disposed && prepared && !frame && !document.hidden) frame = requestAnimationFrame(tick) }
        function fit() {
          const width = element.clientWidth, height = element.clientHeight
          if (!width || !height) return
          renderer.setSize(width, height, false); camera.aspect = width/height
          camera.fov = fovFor(latest.current.view); if (!transition) {
            if (homeElement.clientWidth >= 768) camera.clearViewOffset()
            else camera.clearViewOffset()
          } else transition.toOffset = [0, 0]
          camera.updateProjectionMatrix()
          if (transition) transition.toFov = camera.fov
          render()
        }
        function setTheme(value) {
          const night = value === 'night'
          ambient.intensity = night ? .3 : .85; key.intensity = night ? .5 : 3; fill.intensity = night ? .3 : .65
          practical.intensity = night ? 2.2 : 0; scene.environmentIntensity = night ? .32 : .75
          floor.material.opacity = night ? .35 : .16
          render()
        }
        controller.current = { setTheme, compose }
        setTheme(latest.current.theme); fit()
        await renderer.compileAsync(scene, camera)
        if (disposed || abort.signal.aborted) return
        prepared = true; controls.addEventListener('change', render)
        const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
        function pick(event) {
          const rect = renderer.domElement.getBoundingClientRect()
          pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1)
          raycaster.setFromCamera(pointer, camera)
          const intersection = raycaster.intersectObject(model, true)[0]
          let node = intersection?.object
          while (node) {
            const name = node.name
            if (['Camera_Film', 'Camera_Mirrorless'].includes(name)) return 'camera'
            if (name === 'HOTSPOT_guestbook') return latest.current.view === 'photo' ? 'guestbook' : 'photo-area'
            if (['PHOTOGRAPHY_ZONE', 'AUDIO_ZONE', 'Ceramic_Mug_Base'].includes(name) || name.startsWith('Guestbook_') || (name === 'Rear_Counter_28mm' && intersection.point.x > -.3) || name === 'Rear_Right_Backing') return 'photo-area'
            if (['Pegboard_Perforated_21x14', 'Pegboard_Headphones'].includes(name)) return 'board'
            const actions = { HOTSPOT_monitor:'monitor', HOTSPOT_lamp:'lamp', HOTSPOT_cv:'cv', HOTSPOT_badge:'badge', HOTSPOT_map:'map' }
            if (actions[name]) return actions[name]
            node = node.parent
          }
        }

        let down = null, gestureUsed = false
        const activePointers = new Set()
        renderer.domElement.onpointerdown = event => {
          if (!activePointers.size) gestureUsed = false
          activePointers.add(event.pointerId)
          if (activePointers.size > 1) gestureUsed = true
          down = { x: event.clientX, y: event.clientY }
        }
        renderer.domElement.onpointermove = event => {
          const hit = !transition && !latest.current.object && !event.buttons ? pick(event) : null
          const labels = { monitor: latest.current.view === 'work' ? 'Projects' : 'Work & ideas', camera: 'Photography', lamp: 'Light', cv: 'View CV', badge: 'About me', guestbook: 'Leave a note', map: 'Explore map', board: 'Pegboard', 'photo-area': latest.current.view === 'photo' ? '' : 'Photography' }
          renderer.domElement.dataset.cursor = labels[hit] || ''
          renderer.domElement.style.cursor = labels[hit] ? 'pointer' : 'grab'
        }
        renderer.domElement.onpointercancel = event => { activePointers.delete(event.pointerId); down = null }
        renderer.domElement.onpointerup = event => {
          activePointers.delete(event.pointerId)
          if (gestureUsed || event.button !== 0 || !down || transition || latest.current.object || Math.hypot(event.clientX-down.x,event.clientY-down.y)>6) { down = null; return }
          down = null
          const destination = pick(event), state = latest.current
          if (destination === 'monitor') { if (state.view !== 'work') state.onView('work'); else navigate('/projects') }
          else if (destination === 'camera') { if (state.view !== 'photo') state.onView('photo'); else state.openCamera(event) }
          else if (destination === 'photo-area') { if (state.view !== 'photo') state.onView('photo') }
          else if (destination === 'board') state.onBoard()
          else if (destination === 'lamp') state.toggleTheme()
          else if (['cv', 'badge', 'guestbook'].includes(destination)) state.onInspect(destination)
          else if (destination === 'map') navigate('/projects/shanxi-map')
        }
        document.addEventListener('visibilitychange', render); cleanups.push(() => document.removeEventListener('visibilitychange', render))
        observer = new ResizeObserver(fit); observer.observe(element)
        clearTimeout(timer); element.dataset.state = 'ready'; element.dataset.moving = 'false'; onStatus('ready')
        compose(latest.current.view, latest.current.object)
      } catch (error) { clearTimeout(timer); element.dataset.error = error.message; fail() }
    }
    start()
    return () => {
      disposed = true; abort.abort(); clearTimeout(timer); cancelAnimationFrame(frame)
      observer?.disconnect(); controls?.dispose(); cleanups.forEach(fn => fn()); controller.current = null
      disposeObject(scene || model); environment?.dispose()
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove() }
    }
  }, [navigate, onStatus, home])
  return <div ref={host} className="workbench-canvas" data-state="loading" />
}
