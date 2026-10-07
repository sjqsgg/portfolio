import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { boardObjectDefaults, normalizeObjects } from '../src/portfolio/boardObjectsStore.js'
import { createBoardObjects } from '../src/portfolio/boardObjects.js'
import { scaleBoardObject, resizeBoardObject } from '../src/portfolio/boardObjectTransforms.js'

const size = new THREE.Vector3(.924,.616,.009)
async function pinTemplate() {
  const bytes = await readFile(new URL('../public/models/board-pushpins.glb', import.meta.url))
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`)

test('five default objects, with untouched scratch coat and locked tray supplies',()=>{
  const items=normalizeObjects(boardObjectDefaults)
  assert.equal(items.length,5)
  assert.deepEqual(items.find(i=>i.type==='scratch').strokes,[])
  assert.equal(items.find(i=>i.type==='pins').movable,false)
  assert.equal(items.find(i=>i.type==='stack').movable,false)
})
test('import rejects duplicates, unknown types, bad strokes and oversized layouts',()=>{
  const item=boardObjectDefaults[0]
  assert.throws(()=>normalizeObjects([item,item]))
  assert.throws(()=>normalizeObjects([{...item,type:'__proto__'}]))
  assert.throws(()=>normalizeObjects([{...item,strokes:[[NaN,0,0,0]]}]))
  assert.throws(()=>normalizeObjects(Array(41).fill(item)))
})
test('all numeric inputs remain finite, positive dimensions and bounded positions',()=>{
  const [item]=normalizeObjects([{...boardObjectDefaults[0],width:-10,height:Infinity,x:500,y:-500,rotation:70,depth:NaN,color:'url(evil)',text:'x'.repeat(300)}])
  assert.equal(item.width,.008)
  assert.equal(item.height,.27)
  assert.ok(Math.abs(item.x)<.47&&Math.abs(item.y)<.47)
  assert.equal(item.color,'#1763a1')
  assert.equal(item.text.length,180)
})
test('key components are independent and sway settles back to rest',()=>{
  const layer=createBoardObjects(THREE,new THREE.Vector3(.924,.616,.009))
  layer.setItems([boardObjectDefaults[2]])
  const record=layer.get('keys')
  assert.equal(record.pivots.length,5)
  assert.ok(record.root.getObjectByName('Carabiner gate'))
  assert.ok(record.root.getObjectByName('Key 1 bow'))
  layer.animate(100,{id:'keys',start:0})
  assert.notEqual(record.pivots[0].rotation.z,record.pivots[0].userData.rest)
  layer.animate(2400,{id:'keys',start:0})
  assert.equal(record.pivots[0].rotation.z,record.pivots[0].userData.rest)
  layer.dispose()
})
test('lightweight imported box retains lid and nine pin clusters without sticker; sheets dispose',async()=>{
  const template=await pinTemplate()
  const layer=createBoardObjects(THREE,size,template)
  layer.setItems(normalizeObjects(boardObjectDefaults.slice(3)))
  const box=layer.get('pin-box').root
  assert.ok(box.getObjectByName('Pushpin_box'))
  assert.ok(box.getObjectByName('Pushpin_lid'))
  const clusters=[]
  let triangles=0
  box.traverse(node=>{
    if(node.name.startsWith('Pushpin_cluster_')) clusters.push(node)
    if(node.isMesh) triangles+=(node.geometry.index?.count || node.geometry.attributes.position.count)/3
    assert.notEqual(node.name,'tripo_part_4')
  })
  assert.equal(clusters.length,9)
  assert.ok(triangles<50000)
  assert.ok(new Set(clusters.map(node=>node.material.color.getHexString())).size===3)
  assert.equal(layer.get('note-stack').root.children.length,10)
  let disposed=false
  layer.get('note-stack').root.children[0].geometry.addEventListener('dispose',()=>{disposed=true})
  layer.setItems([])
  assert.equal(disposed,true)
  assert.equal(layer.group.children.length,0)
})

test('box recoloring preserves geometry and disposing modal cannot damage shared scene/template',async()=>{
  const template=await pinTemplate(), item=normalizeObjects([boardObjectDefaults[3]])[0]
  const main=createBoardObjects(THREE,size,template), modal=createBoardObjects(THREE,size,template)
  main.setItems([item]);modal.setItems([item])
  const original=modal.get(item.id).root.getObjectByName('Pushpin_box')
  const other=main.get(item.id).root.getObjectByName('Pushpin_box')
  const source=template.getObjectByName('Pushpin_box')
  const dimensions=new THREE.Box3().setFromObject(modal.get(item.id).root).getSize(new THREE.Vector3())
  assert.notEqual(original.geometry,other.geometry)
  assert.notEqual(original.geometry,source.geometry)
  let disposed=false, damaged=false
  original.geometry.addEventListener('dispose',()=>{disposed=true})
  other.geometry.addEventListener('dispose',()=>{damaged=true})
  source.geometry.addEventListener('dispose',()=>{damaged=true})
  modal.setItems([{...item,color:'#315247',lidColor:'#e5d6af',accent:'#af7770',pinColor2:'#b4a668',pinColor3:'#85a292',scale:1.4}])
  const root=modal.get(item.id).root
  assert.equal(root.getObjectByName('Pushpin_box').material.color.getHexString(),'315247')
  assert.equal(root.getObjectByName('Pushpin_lid').material.color.getHexString(),'e5d6af')
  const scaled=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
  for(const axis of ['x','y','z']) close(scaled[axis],dimensions[axis]*1.4)
  assert.equal(disposed,true)
  modal.dispose()
  assert.equal(damaged,false)
  main.dispose()
})

test('locked corner resize scales all dimensions uniformly around the opposite corner',()=>{
  const item={...normalizeObjects([boardObjectDefaults[0]])[0],x:0,y:0,scale:.5}
  const anchor={x:-.1,y:-.2},start={x:.1,y:.2},point={x:.2,y:.4}
  const result=resizeBoardObject(item,start,point,anchor,true)
  close(result.scale,.75)
  close(result.x,.05);close(result.y,.1)
  const bounded=normalizeObjects([{...item,...scaleBoardObject(item,100),x:1,y:1}])[0]
  close(bounded.height*bounded.scale,.34)
  assert.ok(bounded.width*bounded.scale<=.4)
  assert.ok(bounded.x<.4&&bounded.y<.3)
  close(scaleBoardObject(item,-10).scale,.1)
})

test('unlocked corners stretch width and height separately; serialization preserves scale and colors',()=>{
  const item=normalizeObjects([boardObjectDefaults[3]])[0]
  const anchor={x:-.1,y:-.1}, start={x:.1,y:.1}, point={x:.2,y:.05}
  const result=resizeBoardObject(item,start,point,anchor,false)
  close(result.width,item.width*1.5);close(result.height,item.height*.75)
  assert.equal(result.depth,undefined)
  const changed={...item,...result,scale:1.2,lockAspect:false,lidColor:'#123456',pinColor2:'#abcdef',pinColor3:'#654321'}
  assert.deepEqual(normalizeObjects(JSON.parse(JSON.stringify([changed]))),normalizeObjects([changed]))
  const normalized=normalizeObjects([changed])[0]
  assert.equal(normalized.lockAspect,false)
  assert.equal(normalized.scale,1.2)
  assert.equal(normalized.pinColor2,'#abcdef')
})
