import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as T from 'three'
import { computerMaterialLabels, createComputerCaseControls } from '../src/portfolio/computerCaseControls.js'

// Load the real production hierarchy and vertex payloads; textures are not
// needed for transform/attachment checks and would require a browser decoder.
async function fixture() {
  const bytes = await readFile(new URL('../public/models/workstation-v003.glb', import.meta.url))
  const length = bytes.readUInt32LE(12), g = JSON.parse(bytes.subarray(20, 20 + length)), bin = bytes.subarray(28 + length)
  function attribute(id) {
    const a = g.accessors[id], v = g.bufferViews[a.bufferView], values = new Float32Array(a.count * 3)
    for (let i = 0; i < a.count; i++) for (let j = 0; j < 3; j++) values[i * 3 + j] = bin.readFloatLE((v.byteOffset || 0) + (a.byteOffset || 0) + i * (v.byteStride || 12) + j * 4)
    return new T.BufferAttribute(values, 3)
  }
  const nodes = g.nodes.map(n => {
    const obj = new T.Group(); obj.name = n.name
    if (n.matrix) new T.Matrix4().fromArray(n.matrix).decompose(obj.position, obj.quaternion, obj.scale)
    else { obj.position.fromArray(n.translation || [0, 0, 0]); obj.quaternion.fromArray(n.rotation || [0, 0, 0, 1]); obj.scale.fromArray(n.scale || [1, 1, 1]) }
    if (n.mesh !== undefined) {
      // Case meshes all have one primitive. Preserve the actual mesh's name.
      const primitives = g.meshes[n.mesh].primitives
      const meshes = primitives.map(p => {
        const geometry = new T.BufferGeometry(); geometry.setAttribute('position', attribute(p.attributes.POSITION))
        const material = new T.MeshStandardMaterial(); material.name = g.materials[p.material].name
        return new T.Mesh(geometry, material)
      })
      if (meshes.length === 1) {
        const mesh = meshes[0]; mesh.name = obj.name; mesh.position.copy(obj.position); mesh.quaternion.copy(obj.quaternion); mesh.scale.copy(obj.scale); return mesh
      }
      obj.add(...meshes)
    }
    return obj
  })
  g.nodes.forEach((n, i) => n.children?.forEach(child => nodes[i].add(nodes[child])))
  const model = new T.Group(); model.add(...g.scenes[g.scene || 0].nodes.map(id => nodes[id])); model.updateMatrixWorld(true)
  return model
}
const box = node => new T.Box3().setFromObject(node)
const center = node => box(node).getCenter(new T.Vector3())
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`)
function endpoint(mesh, end = false) {
  mesh.updateWorldMatrix(true, false)
  const positions = mesh.geometry.attributes.position, result = new T.Vector3()
  const first = end ? positions.count - 13 : 0
  for (let i = 0; i < 12; i++) result.add(new T.Vector3().fromBufferAttribute(positions, first + i))
  return result.multiplyScalar(1 / 12).applyMatrix4(mesh.matrixWorld)
}

test('grouping preserves the approved scene and keeps saved layouts reversible', async () => {
  const model = await fixture(), gpu = model.getObjectByName('Computer_Interior_graphics_card_body')
  const before = box(gpu), original = gpu.geometry
  const api = createComputerCaseControls(T, model)
  const grouped = box(gpu)
  for (const axis of ['x', 'y', 'z']) { near(before.min[axis], grouped.min[axis]); near(before.max[axis], grouped.max[axis]) }
  assert.equal(gpu.geometry, original)
  const start = center(model.getObjectByName('Computer_Control_gpu'))
  api.apply('gpu', { heightMm: 90, xMm: 25, yMm: -15 })
  const moved = center(model.getObjectByName('Computer_Control_gpu'))
  near(moved.x - start.x, .025); near(moved.y - start.y, -.015)
  const saved = JSON.parse(JSON.stringify(api.getState()))
  api.reset(); api.applyState(saved)
  near(center(model.getObjectByName('Computer_Control_gpu')).x, moved.x)
  api.reset(); near(center(model.getObjectByName('Computer_Control_gpu')).x, start.x)
})

test('coolant and power cable endpoints follow their components while routing and diameter stay independent', async () => {
  const model = await fixture(), api = createComputerCaseControls(T, model)
  const pipe = model.getObjectByName('Computer_Interior_coolant_run_1'), original = pipe.geometry
  api.apply('coolant-1', { diameterMm: 14 })
  const start = endpoint(pipe), end = endpoint(pipe, true)
  api.apply('cpu', { yMm: 40 })
  near(endpoint(pipe).y - start.y, .04); near(endpoint(pipe, true).distanceTo(end), 0)
  const attached = endpoint(pipe)
  api.apply('coolant-1', { bendXmm: 35, bendZmm: -20 })
  near(endpoint(pipe).distanceTo(attached), 0); near(endpoint(pipe, true).distanceTo(end), 0)
  api.apply('power-cables', { diameterMm: 12 })
  const cables = [1, 2, 3].map(i => model.getObjectByName(`Computer_Interior_gpu_cable_${i}`))
  const starts = cables.map(mesh => endpoint(mesh)), ends = cables.map(mesh => endpoint(mesh, true))
  api.apply('gpu', { xMm: 30 })
  cables.forEach((mesh, i) => { near(endpoint(mesh).x - starts[i].x, .03); near(endpoint(mesh, true).distanceTo(ends[i]), 0) })
  api.apply('radiator', { zMm: 20 })
  near(endpoint(pipe, true).z - end.z, .02)
  api.reset(); assert.equal(pipe.geometry, original)
})

test('radiator edits carry fan positions without corrupting independent millimetre dimensions', async () => {
  const model = await fixture(), api = createComputerCaseControls(T, model)
  const fan = model.getObjectByName('Computer_Control_fan-1'), baseline = box(fan).getSize(new T.Vector3()), start = center(fan)
  const width = api.defaults.parts.radiator.widthMm
  api.apply('radiator', { widthMm: width * 1.4, yMm: 20 })
  const actual = box(fan).getSize(new T.Vector3())
  near(actual.x, baseline.x); near(actual.y, baseline.y); near(center(fan).y - start.y, .02)
  api.apply('fan-1', { widthMm: 100, xMm: 10 })
  near(box(fan).getSize(new T.Vector3()).x, .1)
  const saved = api.getState(), other = createComputerCaseControls(T, await fixture())
  other.applyState(saved); assert.deepEqual(other.getState(), saved)
})

test('outer surfaces and all material-linked meshes have reversible dimensions without moving the bay or internals', async () => {
  const model = await fixture(), glass = model.getObjectByName('Computer_Tower_Smoked_Window')
  const before = box(glass), api = createComputerCaseControls(T, model)
  for (const axis of ['x', 'y', 'z']) { near(box(glass).min[axis], before.min[axis]); near(box(glass).max[axis], before.max[axis]) }
  const gpuBefore = box(model.getObjectByName('Computer_Control_gpu'))
  const bay = box(model.getObjectByName('Computer_Cabinet_Left_Side_Panel'))
  for (const name of Object.keys(computerMaterialLabels)) assert.ok(api.parts.some(part => part.materials.includes(name)), name)
  model.getObjectByName('Computer_Tower').traverse(node => {
    if (node.isMesh) assert.ok(node.parent.name.startsWith('Computer_Control_'), node.name)
  })
  api.apply('glass', { widthMm: 420, heightMm: 460, depthMm: 8, yMm: 35 })
  const size = box(glass).getSize(new T.Vector3())
  near(size.x, .42); near(size.y, .46); near(size.z, .008)
  near(center(glass).y - before.getCenter(new T.Vector3()).y, .035)
  api.apply('shell', { widthMm: 450, yMm: 12 })
  api.apply('accent', { heightMm: 500, xMm: -10 })
  assert.deepEqual(box(model.getObjectByName('Computer_Control_gpu')), gpuBefore)
  assert.deepEqual(box(model.getObjectByName('Computer_Cabinet_Left_Side_Panel')), bay)
  const saved = api.getState(), otherModel = await fixture(), other = createComputerCaseControls(T, otherModel)
  other.applyState(JSON.parse(JSON.stringify(saved)))
  assert.deepEqual(other.getState(), saved)
  for (const axis of ['x', 'y', 'z']) near(center(otherModel.getObjectByName('Computer_Tower_Smoked_Window'))[axis], center(glass)[axis])
  api.reset()
  for (const axis of ['x', 'y', 'z']) { near(box(glass).min[axis], before.min[axis]); near(box(glass).max[axis], before.max[axis]) }
})

test('the approved draft is preserved exactly as the runtime baseline', async () => {
  const approved = JSON.parse(await readFile(new URL('../docs/checkpoints/computer-case-approved-2026-10-09.json', import.meta.url)))
  const current = JSON.parse(await readFile(new URL('../docs/workstation-current.json', import.meta.url)))
  for (const key of ['parts', 'materials', 'board', 'lighting', 'computer']) assert.deepEqual(current[key], approved[key])
  const api = createComputerCaseControls(T, await fixture()), applied = api.applyState(current.computer)
  for (const [id, values] of Object.entries(approved.computer.parts)) assert.deepEqual(applied.parts[id], values, id)
})
