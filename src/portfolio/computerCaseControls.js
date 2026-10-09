// One interface owns case grouping, millimetre transforms and attached routes.
export const computerMaterialLabels = {
  Computer_case_warm_shell: '外框',
  Computer_case_sage_accent: '外框饰条',
  Computer_case_smoked_glass: '玻璃',
  Computer_internal_warm_white: '内部面板',
  Computer_internal_satin_silver: '内部金属',
  Computer_internal_sage_board: '主板',
  Computer_internal_soft_recess: '凹槽与风扇底色',
  Computer_internal_ivory_tube: '管线',
}

export function createComputerCaseControls(T, model, onChange = () => {}) {
  const interior = model.getObjectByName('Computer_Tower_Internals')
  if (!interior) return null
  const groups = new Map(), defaults = {}, state = {}, routes = []
  const definitions = [
    ['shell', '外框', ['Computer_Tower_Bottom_Rail', 'Computer_Tower_Left_Rail', 'Computer_Tower_Top_Rail']],
    ['accent', '外框饰条', ['Computer_Tower_Right_Rail']],
    ['glass', '玻璃', ['Computer_Tower_Smoked_Window']],
    ['back-panel', '内部背板', ['back_panel']],
    ['bottom-plate', '内部底板', ['bottom_plate']],
    ['top-panel', '内部顶板', ['top_panel']],
    ['rear-spine', '内部后立条', ['rear_spine']],
    ['front-intake', '前部进风框与凹槽', ['front_intake_frame', ...Array.from({ length: 7 }, (_, i) => `intake_channel_0${i + 1}`)]],
    ['gpu', '显卡', ['graphics_card_body', 'graphics_card_top', 'graphics_card_end', 'graphics_card_recess']],
    ['motherboard', '主板', ['mainboard', 'board_upper_heatsink']],
    ['cpu', 'CPU 散热块', ['cpu_block', 'cpu_pump_cap', 'cpu_pump_rim']],
    ['ram-1', '内存条 1', ['ram_1']], ['ram-2', '内存条 2', ['ram_2']],
    ['shroud', '电源罩', ['power_supply_shroud']],
    ['radiator', '顶部散热器与风扇', ['top_radiator']],
    ...[1, 2, 3].map(i => [`fan-${i}`, `顶部风扇 ${i}`, ['frame', 'recess', 'rim', 'hub', 'blades'].map(p => `radiator_fan_${i}_${p}`)]),
    ['rear-fan', '后风扇', ['rear_fan_recess', 'rear_fan_rim', 'rear_fan_hub', 'rear_fan_blades']],
    ['coolant-1', '冷却管 1', ['coolant_run_1'], 'tube', 12],
    ['coolant-2', '冷却管 2', ['coolant_run_2'], 'tube', 12],
    ['power-cables', '显卡电源线', ['gpu_cable_1', 'gpu_cable_2', 'gpu_cable_3', 'gpu_cable_comb'], 'tube', 9],
  ]
  model.updateMatrixWorld(true)
  for (const [id, label, names, kind = 'solid', diameterMm] of definitions) {
    const nodes = names.map(name => model.getObjectByName(name.startsWith('Computer_') ? name : `Computer_Interior_${name}`)).filter(Boolean)
    if (!nodes.length) continue
    const center = new T.Box3()
    nodes.forEach(node => center.union(new T.Box3().setFromObject(node)))
    const group = new T.Group(); group.name = `Computer_Control_${id}`
    interior.add(group); group.position.copy(interior.worldToLocal(center.getCenter(new T.Vector3())))
    group.updateWorldMatrix(true, true)
    nodes.forEach(node => group.attach(node))
    groups.set(id, { id, label, kind, diameterMm, group })
  }
  // Fans keep their own controls while following the radiator as an assembly.
  for (const id of ['fan-1', 'fan-2', 'fan-3']) {
    groups.get('radiator')?.group.attach(groups.get(id).group)
  }
  model.updateMatrixWorld(true)
  for (const part of groups.values()) {
    const { id, kind, group, diameterMm } = part
    const size = new T.Box3().setFromObject(group).getSize(new T.Vector3()).multiplyScalar(1000)
    part.baseline = { position: group.position.clone(), scale: group.scale.clone(), quaternion: group.quaternion.clone() }
    defaults[id] = kind === 'tube' ? { diameterMm, bendXmm: 0, bendYmm: 0, bendZmm: 0 } : {
      widthMm: size.x, heightMm: size.y, depthMm: size.z,
      xMm: 0, yMm: 0, zMm: 0, rotationX: 0, rotationY: 0, rotationZ: 0,
    }
    state[id] = { ...defaults[id] }
  }
  const point = (x, y, z) => interior.worldToLocal(new T.Vector3(x, z, -y))
  function route(partId, meshName, points, startId, endId) {
    const mesh = model.getObjectByName(`Computer_Interior_${meshName}`)
    const base = points.map(([x, y, z]) => point(x, y, z))
    const anchors = [startId, endId].map((id, index) => {
      const group = groups.get(id).group
      const world = interior.localToWorld(base[index === 0 ? 0 : base.length - 1].clone())
      return { group, local: group.worldToLocal(world) }
    })
    routes.push({ partId, mesh, base, anchors, original: mesh.geometry })
  }
  for (let i = 0; i < 2; i++) {
    const shift = i * .023
    route(`coolant-${i + 1}`, `coolant_run_${i + 1}`, [
      [-.669, .711, .494 - shift], [-.734, .645, .494 - shift],
      [-.820 + shift, .577, .520 - shift], [-.836 + shift, .596, .628],
    ], 'cpu', 'radiator')
  }
  for (let i = 0; i < 3; i++) {
    const x = -.496 + i * .015
    route('power-cables', `gpu_cable_${i + 1}`, [
      [x, .554, .366], [x, .534, .343], [x, .538, .280], [x, .571, .256], [x, .626, .233],
    ], 'gpu', 'shroud')
  }
  const comb = model.getObjectByName('Computer_Interior_gpu_cable_comb')
  const combPosition = comb.position.clone()
  const combReference = routes.find(r => r.mesh.name === 'Computer_Interior_gpu_cable_2').base[2].clone()
  function normalize(id, values) {
    const base = defaults[id], next = { ...state[id], ...values }
    return Object.fromEntries(Object.keys(base).map(key => {
      const value = Number.isFinite(next[key]) ? next[key] : base[key]
      const limits = key.endsWith('Mm') && ['widthMm', 'heightMm', 'depthMm'].includes(key) ? [base[key] * .2, base[key] * 2.5]
        : key === 'diameterMm' ? [1, 24] : key.startsWith('rotation') ? [-180, 180] : [-250, 250]
      return [key, T.MathUtils.clamp(value, ...limits)]
    }))
  }
  function transform(part) {
    if (part.kind === 'tube') return
    const v = state[part.id], b = part.baseline, d = defaults[part.id]
    part.group.scale.set(b.scale.x * v.widthMm / d.widthMm, b.scale.y * v.heightMm / d.heightMm, b.scale.z * v.depthMm / d.depthMm)
    part.group.parent.updateWorldMatrix(true, false)
    const parentInverse = part.group.parent.matrixWorld.clone().invert()
    const offset = new T.Vector3(v.xMm, v.yMm, v.zMm).multiplyScalar(.001)
    const origin = interior.localToWorld(new T.Vector3()).applyMatrix4(parentInverse)
    const localOffset = interior.localToWorld(offset).applyMatrix4(parentInverse).sub(origin)
    part.group.position.copy(b.position).add(localOffset)
    if (part.group.parent !== interior) part.group.scale.divide(part.group.parent.scale)
    part.group.quaternion.copy(b.quaternion).multiply(new T.Quaternion().setFromEuler(new T.Euler(...[v.rotationX, v.rotationY, v.rotationZ].map(T.MathUtils.degToRad))))
  }
  function reroute() {
    model.updateMatrixWorld(true)
    for (const r of routes) {
      const v = state[r.partId]
      const ends = r.anchors.map(a => interior.worldToLocal(a.group.localToWorld(a.local.clone())))
      const deltas = [ends[0].clone().sub(r.base[0]), ends[1].clone().sub(r.base.at(-1))]
      const offset = new T.Vector3(v.bendXmm, v.bendYmm, v.bendZmm).multiplyScalar(.001)
      const unchanged = deltas.every(delta => delta.length() < 1e-7) && offset.length() < 1e-7 && Math.abs(v.diameterMm - defaults[r.partId].diameterMm) < 1e-7
      const points = r.base.map((p, index) => {
        if (index === 0) return ends[0]
        if (index === r.base.length - 1) return ends[1]
        const t = index / (r.base.length - 1)
        return p.clone().addScaledVector(deltas[0], 1 - t).addScaledVector(deltas[1], t).add(offset)
      })
      if (r.mesh.geometry !== r.original) r.mesh.geometry.dispose()
      if (unchanged) r.mesh.geometry = r.original
      else {
        // Construct in the case's axes so tube diameter stays circular even
        // when a connected component has been scaled differently on each axis.
        const curve = new T.CatmullRomCurve3(points, false, 'centripetal')
        const geometry = new T.TubeGeometry(curve, 64, v.diameterMm / 2000, 12, false)
        const toMesh = r.mesh.matrixWorld.clone().invert().multiply(interior.matrixWorld)
        geometry.applyMatrix4(toMesh); r.mesh.geometry = geometry
      }
      if (r.mesh.name === 'Computer_Interior_gpu_cable_2') {
        const parent = comb.parent
        const displacement = points[2].clone().sub(combReference)
        const world = interior.localToWorld(combReference.clone().add(displacement))
        const origin = parent.worldToLocal(interior.localToWorld(combReference.clone()))
        comb.position.copy(combPosition).add(parent.worldToLocal(world).sub(origin))
      }
    }
    model.updateMatrixWorld(true)
  }
  function applyState(draft = {}) {
    for (const part of groups.values()) {
      state[part.id] = normalize(part.id, { ...defaults[part.id], ...draft.parts?.[part.id] })
      transform(part)
    }
    reroute(); onChange()
    return getState()
  }
  function getState() { return { version: 1, parts: structuredClone(state) } }
  return {
    parts: [...groups.values()].map(({ id, label, kind, group }) => {
      const materials = new Set()
      group.traverse(node => {
        if (node.isMesh) for (const material of [node.material].flat()) materials.add(material.name)
      })
      return { id, label, kind, materials: [...materials], defaults: { ...defaults[id] } }
    }),
    defaults: { version: 1, parts: structuredClone(defaults) },
    getState, applyState,
    apply(id, values) {
      if (!groups.has(id)) return null
      state[id] = normalize(id, values)
      for (const part of groups.values()) transform(part)
      reroute(); onChange()
      return { ...state[id] }
    },
    reset(id) {
      if (id) return this.apply(id, defaults[id])
      return applyState()
    },
    updateAttachments: reroute,
    dispose() { for (const r of routes) if (r.mesh.geometry !== r.original) r.original.dispose() },
  }
}
