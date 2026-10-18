// Runs inside the workstation's existing render loop; no second renderer or clock.
let welcomed = false
const duration = 5150
const lampWhite = 0xfffcf8
const smooth = t => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x) }

export function createLampIntro(THREE, { model, scene, home, element, lighting, restore, replay = false, skip = false }) {
  const shade = model.getObjectByName('Lamp_Shade')
  const diffuser = model.getObjectByName('Lamp_Diffuser')
  const monitor = model.getObjectByName('HOTSPOT_monitor')
  const camera = model.getObjectByName('Camera_Mirrorless')
  if (!shade || !diffuser || !monitor || !camera) return null

  const parent = shade.parent
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(shade)
  const joint = bounds.getCenter(new THREE.Vector3()); joint.y = bounds.max.y
  const head = new THREE.Group()
  head.name = 'Lamp_Intro_Head'
  head.position.copy(parent.worldToLocal(joint.clone()))
  parent.add(head); head.updateWorldMatrix(true, false)
  head.attach(shade); head.attach(diffuser)
  const resting = head.quaternion.clone()
  const down = new THREE.Vector3(0, -1, 0)
  const parentRotation = parent.getWorldQuaternion(new THREE.Quaternion()).invert()
  const positionOf = node => new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3())
  const targets = [positionOf(monitor), positionOf(camera)]
  const rotations = targets.map(target => new THREE.Quaternion().setFromUnitVectors(down, target.clone().sub(joint).normalize().applyQuaternion(parentRotation)))

  const spot = new THREE.SpotLight(lampWhite, 0, 5, .52, .32, 1.3)
  spot.visible = false
  spot.castShadow = true
  spot.shadow.mapSize.set(1024, 1024)
  spot.shadow.normalBias = .006
  spot.shadow.bias = -.0002
  spot.shadow.camera.near = .03
  scene.add(spot, spot.target)

  // The lamp sits behind the monitor. A short-range desk bounce makes its
  // front readable while the main moving spotlight still supplies shadows.
  const monitorBounce = new THREE.PointLight(lampWhite, 0, .95, 2)
  monitorBounce.position.copy(targets[0]).add(new THREE.Vector3(0, .08, .32))
  monitorBounce.visible = false
  scene.add(monitorBounce)
  const emissives = new Map()
  const surfaceColors = new Map()
  model.traverse(node => {
    for (const surface of Array.isArray(node.material) ? node.material : [node.material]) {
      if (surface?.emissive) emissives.set(surface, surface.emissiveIntensity)
      if (surface?.color && !surfaceColors.has(surface)) {
        const original = surface.color.clone()
        const luminance = original.r * .2126 + original.g * .7152 + original.b * .0722
        const neutral = new THREE.Color().setRGB(luminance, luminance, luminance)
        // Keep at least 70% of the original color: this is a soft grade,
        // not a grayscale model waiting to receive its final palette.
        const softened = original.clone().lerp(neutral, .3)
        surfaceColors.set(surface, { original, softened })
      }
    }
  })
  const lightTints = [
    [lighting.key.color, 0xf3f6f8],
    [lighting.ambient.color, 0xf0f3f5],
    [lighting.ambient.groundColor, 0x50565c],
    [lighting.fill.color, 0xe9eff3],
  ].map(([color, neutral]) => ({ color, original: color.clone(), softened: new THREE.Color(neutral) }))

  function gradeReveal(amount) {
    for (const [surface, colors] of surfaceColors) surface.color.lerpColors(colors.original, colors.softened, amount)
    for (const tint of lightTints) tint.color.lerpColors(tint.original, tint.softened, amount * .5)
  }

  // A finite opening at the lamp mouth, not a cone collapsing to a pinprick.
  // The narrow end is 12% of the footprint radius; the existing projected
  // spotlight still supplies the surface illumination and cast shadows.
  const geometry = new THREE.CylinderGeometry(.12, 1, 1, 48, 1, true)
  geometry.translate(0, -.5, 0)
  const material = new THREE.ShaderMaterial({
    uniforms: { strength: { value: 0 }, color: { value: new THREE.Color(0xf4f5f5) } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 vUv; uniform float strength; uniform vec3 color; void main(){float fade=smoothstep(0.0,0.18,vUv.y)*(1.0-0.45*vUv.y);gl_FragColor=vec4(color,strength*fade);}',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  })
  const beam = new THREE.Mesh(geometry, material)
  beam.visible = false
  beam.raycast = () => {}
  scene.add(beam)
  const diffuserMaterial = diffuser.material
  const glow = diffuserMaterial?.emissive?.clone()
  const glowIntensity = diffuserMaterial?.emissiveIntensity
  let armed = false, started = null, elapsed = 0, previous = null, completed = skip || (welcomed && !replay)

  function phase(value) { element.dataset.lampIntro = value; home.dataset.lampIntro = value }
  function darkness(value) {
    home.style.setProperty('--lamp-darkness', String(value))
    // Switch text polarity before the background reaches mid-gray; blending
    // white text into black at the same rate would make navigation disappear.
    document.documentElement.style.setProperty('--lamp-ui-darkness', value > .55 ? '1' : '0')
  }
  function dim(amount) {
    // Bring diffuse light up slightly ahead of the key to avoid muddy
    // half-lit wood, while retaining the same final lighting values.
    lighting.ambient.intensity = .85 * Math.pow(amount, .82)
    lighting.key.intensity = 3 * amount
    lighting.fill.intensity = .65 * Math.pow(amount, .82)
    lighting.practical.intensity = 0
    scene.environmentIntensity = .75 * Math.pow(amount, .85)
    for (const [surface, intensity] of emissives) surface.emissiveIntensity = intensity * amount
    darkness(1 - amount)
  }
  function finish() {
    if (completed) return
    completed = true; welcomed = true; armed = false
    head.quaternion.copy(resting)
    spot.intensity = 0; spot.visible = false; beam.visible = false; monitorBounce.visible = false
    gradeReveal(0)
    for (const [surface, intensity] of emissives) surface.emissiveIntensity = intensity
    if (glow) { diffuserMaterial.emissive.copy(glow); diffuserMaterial.emissiveIntensity = glowIntensity }
    darkness(0); phase('done'); restore()
  }
  function arm() {
    if (completed || armed) return
    armed = true; spot.visible = true; monitorBounce.visible = true; dim(0); phase('waiting')
  }
  function tick(now, visible) {
    if (!armed || completed) return false
    // Wait for the Loading curtain to finish before starting this performance.
    if (!visible) return false
    if (started === null) { started = now; welcomed = true }
    if (previous === null) previous = now
    elapsed += Math.max(0, now - previous); previous = now
    const t = elapsed
    if (t >= duration) { finish(); return false }
    let light = 0
    if (t < 450) { phase('dark'); head.quaternion.copy(resting) }
    else if (t < 2200) {
      phase('projects')
      head.quaternion.slerpQuaternions(resting, rotations[0], smooth((t - 450) / 650))
      light = smooth((t - 700) / 500)
    } else if (t < 4000) {
      phase('photography')
      head.quaternion.slerpQuaternions(rotations[0], rotations[1], smooth((t - 2200) / 750))
      light = 1
    } else {
      phase('opening')
      head.quaternion.slerpQuaternions(rotations[1], resting, smooth((t - 4000) / 750))
      light = 1 - smooth((t - 4350) / 650)
    }
    // Let the daylight arrive under the fading shaft, rather than blacking
    // out between the two lighting setups. The final values match normal Home.
    const daylight = smooth((t - 4300) / 850)
    dim(daylight)
    // A continuous, gentle correction peaks at half-light and eases away
    // with the light itself. There is no separate grayscale/coloring phase.
    gradeReveal(4 * daylight * (1 - daylight))
    model.updateMatrixWorld(true)
    const source = diffuser.getWorldPosition(new THREE.Vector3())
    const direction = down.clone().applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()))
    spot.position.copy(source).addScaledVector(direction, .025)
    spot.target.position.copy(source).add(direction)
    spot.intensity = light * 22
    monitorBounce.intensity = light * .35 * (1 - smooth((t - 2200) / 500))
    if (glow) { diffuserMaterial.emissive.set(lampWhite); diffuserMaterial.emissiveIntensity = light * 2.5 }
    const distance = THREE.MathUtils.lerp(source.distanceTo(targets[0]), source.distanceTo(targets[1]), smooth((t - 2200) / 750))
    beam.position.copy(spot.position)
    beam.quaternion.setFromUnitVectors(down, direction)
    beam.scale.set(distance * Math.tan(spot.angle), distance, distance * Math.tan(spot.angle))
    material.uniforms.strength.value = light * .24
    beam.visible = light > 0
    element.dataset.lampIntroTime = String(Math.round(t))
    return true
  }
  if (completed) phase('done')
  return {
    arm, tick, finish,
    pause() { previous = null },
    replay() { completed = false; armed = false; started = null; elapsed = 0; previous = null; arm() },
    dispose() {
      head.quaternion.copy(resting)
      gradeReveal(0)
      if (glow) { diffuserMaterial.emissive.copy(glow); diffuserMaterial.emissiveIntensity = glowIntensity }
      for (const [surface, intensity] of emissives) surface.emissiveIntensity = intensity
      scene.remove(spot, spot.target, beam, monitorBounce)
      spot.shadow.dispose(); geometry.dispose(); material.dispose()
      darkness(0); delete home.dataset.lampIntro
    },
  }
}
