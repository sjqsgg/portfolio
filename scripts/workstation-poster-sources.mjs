import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

export const posterSourceFiles = [
  'docs/workstation-current.json',
  'public/models/workstation-v003.glb',
  'public/models/board-pushpins.glb',
  'src/portfolio/Workbench.jsx',
  'src/portfolio/sceneViews.js',
  'src/portfolio/feltBoard.js',
  'src/portfolio/boardObjects.js',
  'src/portfolio/boardObjectsStore.js',
  'src/portfolio/boardObjectTransforms.js',
  'src/portfolio/boardPinModel.js',
  'src/portfolio/workspace.css',
  'src/portfolio/reference-layout.css',
  'src/index.css',
]
export const digest = bytes => createHash('sha256').update(bytes).digest('hex')
export async function posterSources() {
  return Object.fromEntries(await Promise.all(posterSourceFiles.map(async file => [file, digest(await readFile(file))])))
}
