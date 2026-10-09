// Replace only the Computer_Tower subtree. Keep every other scene object's
// transforms, material values, geometry and image payloads unchanged.
import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const target = 'public/models/workstation-v003.glb'
const source = 'assets/3d/workstation-v003/sources/computer-case-production.glb'
function parse(bytes) {
  assert.equal(bytes.toString('utf8', 0, 4), 'glTF')
  const length = bytes.readUInt32LE(12)
  return { gltf: JSON.parse(bytes.subarray(20, 20 + length)), bin: bytes.subarray(28 + length) }
}
const current = parse(await readFile(target)), replacement = parse(await readFile(source))
for (const { gltf } of [current, replacement]) {
  assert.equal(gltf.buffers.length, 1)
  assert.ok(!gltf.animations?.length && !gltf.skins?.length, 'This workstation replacement handles static meshes only')
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function textures(material, fn) {
  if (!material || typeof material !== 'object') return
  for (const [key, value] of Object.entries(material)) {
    if (key.endsWith('Texture') && value && typeof value.index === 'number') fn(value)
    else textures(value, fn)
  }
}
function payload(gltf, bin, accessorId) {
  const a = gltf.accessors[accessorId], view = gltf.bufferViews[a.bufferView]
  assert.ok(!a.sparse)
  return { ...a, bufferView: undefined, bytes: hash(bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength)) }
}
function describe(gltf, bin, node) {
  const result = { ...node, children: node.children?.map(id => gltf.nodes[id].name) }
  if (node.mesh !== undefined) {
    result.mesh = gltf.meshes[node.mesh].primitives.map(primitive => {
      const material = structuredClone(gltf.materials[primitive.material])
      textures(material, info => {
        const texture = gltf.textures[info.index], image = gltf.images[texture.source], view = gltf.bufferViews[image.bufferView]
        info.index = { texture: { ...texture, source: image.name }, imageHash: hash(bin.subarray(view.byteOffset, view.byteOffset + view.byteLength)), sampler: gltf.samplers?.[texture.sampler] }
      })
      return { ...primitive, material, attributes: Object.fromEntries(Object.entries(primitive.attributes).map(([key, id]) => [key, payload(gltf, bin, id)])), indices: primitive.indices === undefined ? undefined : payload(gltf, bin, primitive.indices) }
    })
  }
  return result
}
const descendants = (gltf, root, set = new Set()) => {
  set.add(root)
  for (const id of gltf.nodes[root].children || []) descendants(gltf, id, set)
  return set
}
const oldRoot = current.gltf.nodes.findIndex(node => node.name === 'Computer_Tower')
const newRoot = replacement.gltf.nodes.findIndex(node => node.name === 'Computer_Tower')
assert.ok(oldRoot >= 0 && newRoot >= 0)
const oldTree = descendants(current.gltf, oldRoot)
const preserved = new Map(current.gltf.nodes.filter((_, id) => !oldTree.has(id)).map(node => [node.name, describe(current.gltf, current.bin, node)]))
const g = current.gltf, incoming = structuredClone(replacement.gltf)
const keys = ['nodes', 'meshes', 'materials', 'textures', 'images', 'samplers', 'accessors', 'bufferViews']
const offset = Object.fromEntries(keys.map(key => [key, g[key]?.length || 0]))
const binOffset = Math.ceil(current.bin.length / 4) * 4
for (const view of incoming.bufferViews) view.byteOffset = (view.byteOffset || 0) + binOffset
for (const a of incoming.accessors) a.bufferView += offset.bufferViews
for (const image of incoming.images || []) image.bufferView += offset.bufferViews
for (const texture of incoming.textures || []) {
  texture.source += offset.images
  if (texture.sampler !== undefined) texture.sampler += offset.samplers
}
for (const material of incoming.materials) textures(material, info => { info.index += offset.textures })
for (const mesh of incoming.meshes) for (const primitive of mesh.primitives) {
  if (primitive.material !== undefined) primitive.material += offset.materials
  if (primitive.indices !== undefined) primitive.indices += offset.accessors
  for (const key of Object.keys(primitive.attributes)) primitive.attributes[key] += offset.accessors
}
for (const node of incoming.nodes) {
  if (node.mesh !== undefined) node.mesh += offset.meshes
  if (node.children) node.children = node.children.map(id => id + offset.nodes)
}
for (const key of keys) g[key] = [...(g[key] || []), ...(incoming[key] || [])]
g.nodes[oldRoot] = incoming.nodes[newRoot]
for (const key of ['extensionsUsed', 'extensionsRequired']) {
  const values = [...new Set([...(g[key] || []), ...(incoming[key] || [])])]
  if (values.length) g[key] = values
}
const bin = Buffer.concat([current.bin, Buffer.alloc(binOffset - current.bin.length), replacement.bin])

// Prune the replaced import and pack only reachable binary views. Unchanged
// view payloads are copied verbatim, including every non-computer texture.
function compact(key, used) {
  const map = new Map([...used].sort((a, b) => a - b).map((id, index) => [id, index]))
  g[key] = [...map.keys()].map(id => g[key][id])
  return id => { assert.ok(map.has(id), `Missing ${key} ${id}`); return map.get(id) }
}
const nodes = new Set()
for (const scene of g.scenes) for (const id of scene.nodes) descendants(g, id, nodes)
const nodeIndex = compact('nodes', nodes)
for (const scene of g.scenes) scene.nodes = scene.nodes.map(nodeIndex)
for (const node of g.nodes) if (node.children) node.children = node.children.map(nodeIndex)
const meshIndex = compact('meshes', new Set(g.nodes.filter(node => node.mesh !== undefined).map(node => node.mesh)))
for (const node of g.nodes) if (node.mesh !== undefined) node.mesh = meshIndex(node.mesh)
const primitives = g.meshes.flatMap(mesh => mesh.primitives)
const materialIndex = compact('materials', new Set(primitives.filter(p => p.material !== undefined).map(p => p.material)))
for (const p of primitives) if (p.material !== undefined) p.material = materialIndex(p.material)
const usedTextures = new Set()
for (const material of g.materials) textures(material, info => usedTextures.add(info.index))
const textureIndex = compact('textures', usedTextures)
for (const material of g.materials) textures(material, info => { info.index = textureIndex(info.index) })
const imageIndex = compact('images', new Set(g.textures.map(texture => texture.source)))
const samplerIndex = compact('samplers', new Set(g.textures.filter(t => t.sampler !== undefined).map(t => t.sampler)))
for (const texture of g.textures) {
  texture.source = imageIndex(texture.source)
  if (texture.sampler !== undefined) texture.sampler = samplerIndex(texture.sampler)
}
const usedAccessors = new Set(primitives.flatMap(p => [...Object.values(p.attributes), ...(p.indices === undefined ? [] : [p.indices])]))
const accessorIndex = compact('accessors', usedAccessors)
for (const p of primitives) {
  for (const key of Object.keys(p.attributes)) p.attributes[key] = accessorIndex(p.attributes[key])
  if (p.indices !== undefined) p.indices = accessorIndex(p.indices)
}
const viewIndex = compact('bufferViews', new Set([...g.accessors.map(a => a.bufferView), ...g.images.map(image => image.bufferView)]))
for (const a of g.accessors) a.bufferView = viewIndex(a.bufferView)
for (const image of g.images) image.bufferView = viewIndex(image.bufferView)
const chunks = []
let packedLength = 0
for (const view of g.bufferViews) {
  const padding = (4 - packedLength % 4) % 4
  chunks.push(Buffer.alloc(padding)); packedLength += padding
  chunks.push(bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength))
  view.byteOffset = packedLength; packedLength += view.byteLength
}
chunks.push(Buffer.alloc((4 - packedLength % 4) % 4))
const packed = Buffer.concat(chunks)
g.buffers = [{ byteLength: packed.length }]
for (const [name, expected] of preserved) {
  const node = g.nodes.find(node => node.name === name)
  assert.ok(node, `Lost unrelated node ${name}`)
  assert.deepEqual(describe(g, packed, node), expected, `Changed unrelated object ${name}`)
}
assert.ok(!g.nodes.some(node => node.name === 'Computer_Tower_Muted_Interior'))
assert.ok(g.nodes.some(node => node.name === 'Computer_Tower_Internals'))
const json = Buffer.from(JSON.stringify(g)), padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)])
const header = Buffer.alloc(20), binHeader = Buffer.alloc(8)
header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + padded.length + packed.length, 8)
header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16)
binHeader.writeUInt32LE(packed.length, 0); binHeader.writeUInt32LE(0x004e4942, 4)
await writeFile(target, Buffer.concat([header, padded, binHeader, packed]))
console.log(`Replaced only the computer tower; verified ${preserved.size} other objects unchanged. GLB: ${28 + padded.length + packed.length} bytes.`)
