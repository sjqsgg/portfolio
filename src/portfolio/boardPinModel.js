import { assetPath } from '../data/assetPath'

let pending
export function loadBoardPinModel() {
  if (!pending) pending = import('three/addons/loaders/GLTFLoader.js').then(({GLTFLoader}) => new GLTFLoader().loadAsync(assetPath('/models/board-pushpins.glb'))).then(gltf => gltf.scene).catch(error => { pending = null; throw error })
  return pending
}
