import workstationCurrent from '../../docs/workstation-current.json'

export const FELT_BOARD_NAMES = {
  assembly: 'Felt_Board_Assembly',
  frame: 'Felt_Board_Frame',
  felt: 'Felt_Board_Insert',
  tray: 'Felt_Board_Shallow_Tray',
}

const SOURCE_ENVELOPE_NAMES = ['Felt_Board_Source_Envelope', 'Pegboard_Perforated_21x14']

export function findFeltBoardEnvelope(root) {
  return SOURCE_ENVELOPE_NAMES.map(name => root.getObjectByName(name)).find(Boolean)
}

export const feltBoardDefaults = Object.freeze({ ...workstationCurrent.board })
export const feltBoardPlacement = Object.freeze({ ...workstationCurrent.parts.board })

export const feltBoardProfiles = {
  square: { label: 'Square', radius: 0 },
  soft: { label: 'Soft corners', radius: 1 },
  rounded: { label: 'Rounded', radius: 1.8 },
}

function roundedRectangle(THREE, width, height, radius) {
  const halfW = width / 2, halfH = height / 2
  const r = Math.max(0, Math.min(radius, halfW - .001, halfH - .001))
  const shape = new THREE.Shape()
  shape.moveTo(-halfW + r, -halfH)
  shape.lineTo(halfW - r, -halfH)
  if (r) shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r)
  shape.lineTo(halfW, halfH - r)
  if (r) shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH)
  shape.lineTo(-halfW + r, halfH)
  if (r) shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r)
  shape.lineTo(-halfW, -halfH + r)
  if (r) shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH)
  return shape
}

function panelGeometry(THREE, width, height, depth, radius) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectangle(THREE, width, height, radius), {
    depth,
    bevelEnabled: radius > 0,
    bevelSegments: 2,
    bevelSize: Math.min(.0025, radius * .12),
    bevelThickness: Math.min(.0015, depth * .12),
    curveSegments: 8,
  })
  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function createFeltTexture(THREE) {
  const size = 192, pixels = new Uint8Array(size * size * 4)
  let seed = 9137
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const longFiber = ((i / 4) % size) % 7 === 0 ? 13 : 0
    const value = 104 + (seed % 58) + longFiber
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value
    pixels[i + 3] = 255
  }
  const texture = new THREE.DataTexture(pixels, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(7, 5)
  texture.needsUpdate = true
  return texture
}

export function createFeltBoard(THREE, dimensions, initial = {}) {
  const settings = { ...feltBoardDefaults, ...initial }
  const assembly = new THREE.Group()
  assembly.name = FELT_BOARD_NAMES.assembly

  const frame = new THREE.Group()
  frame.name = FELT_BOARD_NAMES.frame
  const felt = new THREE.Group()
  felt.name = FELT_BOARD_NAMES.felt
  assembly.add(frame, felt)

  const feltTexture = createFeltTexture(THREE)
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Felt_board_walnut', color: `#${settings.frameColor}`, roughness: .58, metalness: 0, clearcoat: .05,
  })
  const feltMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Felt_board_fabric', color: `#${settings.feltColor}`, roughness: .96, metalness: 0, clearcoat: 0,
    bumpMap: feltTexture, bumpScale: .0012,
  })
  const grooveMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Felt_board_groove', color: `#${settings.frameColor}`, roughness: .72, metalness: 0,
  })

  function clearGeometry(group) {
    for (const child of [...group.children]) {
      child.geometry?.dispose()
      group.remove(child)
    }
  }

  function addMesh(group, name, geometry, material, position = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.position.fromArray(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }

  function update(next = {}) {
    Object.assign(settings, next)
    const width = Math.max(.12, dimensions.x)
    const height = Math.max(.12, dimensions.y)
    const depth = Math.max(.008, settings.frameDepth)
    const side = Math.min(settings.sideBorder, width * .2)
    const top = Math.min(settings.topBorder, height * .2)
    const bottom = Math.min(settings.bottomBorder, height * .32)
    const insertWidth = Math.max(.06, width - side * 2)
    const insertHeight = Math.max(.06, height - top - bottom)
    const insertY = (bottom - top) / 2
    const profileMultiplier = feltBoardProfiles[settings.profile]?.radius ?? 1
    const outerRadius = Math.min(settings.cornerRadius * profileMultiplier, height * .16)
    const insertRadius = Math.max(0, outerRadius - side * .45)

    frameMaterial.color.set(`#${settings.frameColor.replace('#', '')}`)
    feltMaterial.color.set(`#${settings.feltColor.replace('#', '')}`)
    grooveMaterial.color.copy(frameMaterial.color).multiplyScalar(.62)
    clearGeometry(frame)
    clearGeometry(felt)

    addMesh(frame, 'Felt_Board_Walnut_Back', panelGeometry(THREE, width, height, depth, outerRadius), frameMaterial)
    // The source model supplies a solid spatial backing rather than a boolean-cut
    // frame. Keep the felt immediately above it and use the narrow border shadow
    // to communicate the requested recess without allowing the backing to hide it.
    const feltZ = depth / 2 + settings.feltDepth / 2 + .0005 - Math.min(.001, Math.max(0, settings.feltInset) * .12)
    addMesh(felt, 'Felt_Board_Fabric_Surface', panelGeometry(THREE, insertWidth, insertHeight, settings.feltDepth, insertRadius), feltMaterial, [0, insertY, feltZ])

    const trayWidth = Math.max(.04, insertWidth - .014)
    const trayY = -height / 2 + bottom * .54
    const trayDepth = Math.max(.002, settings.trayProjection)
    const trayHeight = Math.max(.003, settings.trayLip)
    addMesh(frame, FELT_BOARD_NAMES.tray, panelGeometry(THREE, trayWidth, trayHeight, trayDepth, Math.min(trayHeight / 2, outerRadius)), frameMaterial, [0, trayY, depth / 2 + trayDepth / 2 - .001])
    addMesh(frame, 'Felt_Board_Groove_Shadow', panelGeometry(THREE, trayWidth * .985, Math.max(.0015, trayHeight * .24), .0015, .001), grooveMaterial, [0, trayY + trayHeight * .18, depth / 2 + trayDepth + .0004])
  }

  function dispose() {
    clearGeometry(frame)
    clearGeometry(felt)
    frameMaterial.dispose(); feltMaterial.dispose(); grooveMaterial.dispose(); feltTexture.dispose()
  }

  update(settings)
  return { assembly, frame, felt, materials: { frame: frameMaterial, felt: feltMaterial }, settings, update, dispose }
}
