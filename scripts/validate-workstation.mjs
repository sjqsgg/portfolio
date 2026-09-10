import { readFile, writeFile } from 'node:fs/promises'
import { Matrix4, Quaternion, Vector3, Box3 } from 'three'
import assert from 'node:assert/strict'
const bytes = await readFile('public/models/workstation-v003.glb')
assert.equal(bytes.toString('utf8',0,4),'glTF')
assert.equal(bytes.readUInt32LE(4),2)
const gltf = JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString())
const parents = new Map()
gltf.nodes.forEach((node,index) => node.children?.forEach(child => parents.set(child,index)))
function matrix(index) {
 const node = gltf.nodes[index]
 const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation || [0,0,0])),new Quaternion(...(node.rotation || [0,0,0,1])),new Vector3(...(node.scale || [1,1,1])))
 return parents.has(index) ? matrix(parents.get(index)).multiply(local) : local
}
function bounds(name, children = false) {
 const index = gltf.nodes.findIndex(node => node.name === name)
 assert.ok(index >= 0, `Missing ${name}`)
 const box = new Box3()
 function visit(id) {
  const node = gltf.nodes[id]
  if (node.mesh !== undefined) for (const primitive of gltf.meshes[node.mesh].primitives) {
   const accessor = gltf.accessors[primitive.attributes.POSITION]
   box.union(new Box3(new Vector3(...accessor.min),new Vector3(...accessor.max)).applyMatrix4(matrix(id)))
  }
  if (children) node.children?.forEach(visit)
 }
 visit(index)
 return { min:box.min.toArray(), max:box.max.toArray() }
}
const desk = bounds('Return_Desktop_28mm'), counter = bounds('Rear_Counter_28mm')
for (const b of [desk,counter]) {
 assert.ok(Math.abs(b.max[1]-.74)<.003,'Counter height must remain 0.74 m')
 assert.ok(Math.abs(b.max[1]-b.min[1]-.028)<.003,'Counter thickness must remain 28 mm')
}
const names = ['HOTSPOT_monitor','HOTSPOT_camera_group','HOTSPOT_cv','HOTSPOT_badge','HOTSPOT_guestbook','HOTSPOT_lamp']
const objects = Object.fromEntries(names.map(name=>[name,bounds(name,true)]))
for (const name of ['CV_Rack','Badge_Peg','Guestbook_Stand_Foot']) {
 const index=gltf.nodes.findIndex(node=>node.name===name)
 assert.ok(index>=0)
 assert.ok(!names.includes(gltf.nodes[parents.get(index)]?.name),`${name} must stay planted independently`)
}
const triangles = gltf.meshes.reduce((sum,mesh)=>sum+mesh.primitives.reduce((n,p)=>n+(p.indices!==undefined?gltf.accessors[p.indices].count:gltf.accessors[p.attributes.POSITION].count)/3,0),0)
const report = {valid:true,bytes:bytes.length,triangles,meshCount:gltf.meshes.length,desk,counter,objects,checks:['GLB version/header','required independent interaction roots','0.74 m desk/counter height','28 mm tabletops','stationary rack, badge peg, and guestbook stand']}
await writeFile('assets/3d/workstation-v003/validation.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
