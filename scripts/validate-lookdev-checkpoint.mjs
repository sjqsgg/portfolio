import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2] || 'docs/workstation-lookdev-round-01.json'
const target = path.resolve(file)
const errors = []

function fail(message) { errors.push(message) }
function finite(value, label) { if (!Number.isFinite(value)) fail(`${label} must be a finite number`) }
function range(value, min, max, label) {
  finite(value, label)
  if (Number.isFinite(value) && (value < min || value > max)) fail(`${label} must be between ${min} and ${max}; received ${value}`)
}

let data
try { data = JSON.parse(fs.readFileSync(target, 'utf8')) } catch (error) {
  console.error(`Unable to read checkpoint: ${error.message}`)
  process.exit(1)
}

if (data.version !== 1) fail(`version must be 1; received ${data.version}`)
if (!data.parts || typeof data.parts !== 'object' || Array.isArray(data.parts)) fail('parts must be an object')
if (!data.materials || typeof data.materials !== 'object' || Array.isArray(data.materials)) fail('materials must be an object')
if (!data.lighting || typeof data.lighting !== 'object' || Array.isArray(data.lighting)) fail('lighting must be an object')

if (data.board !== undefined) {
  if (!data.board || typeof data.board !== 'object' || Array.isArray(data.board)) fail('board must be an object')
  else {
    if (!['square', 'soft', 'rounded'].includes(data.board.profile)) fail('board.profile must be square, soft or rounded')
    for (const property of ['sideBorder', 'topBorder', 'bottomBorder', 'frameDepth', 'feltDepth', 'feltInset', 'cornerRadius', 'trayProjection', 'trayLip']) finite(data.board[property], `board.${property}`)
    for (const property of ['frameColor', 'feltColor']) if (typeof data.board[property] !== 'string' || !/^[0-9a-f]{6}$/i.test(data.board[property])) fail(`board.${property} must be a six-digit hex value without #`)
  }
}

for (const [name, part] of Object.entries(data.parts || {})) {
  for (const axis of ['X', 'Y', 'Z']) range(part[`scale${axis}`], .5, 1.5, `parts.${name}.scale${axis}`)
  range(part.thickness, .5, 2, `parts.${name}.thickness`)
  for (const axis of ['X', 'Y', 'Z']) range(part[`position${axis}`], -.3, .3, `parts.${name}.position${axis}`)
  for (const axis of ['X', 'Y', 'Z']) range(part[`rotation${axis}`], -180, 180, `parts.${name}.rotation${axis}`)
  if (typeof part.lockPosition !== 'boolean') fail(`parts.${name}.lockPosition must be boolean`)
}

for (const [name, material] of Object.entries(data.materials || {})) {
  if (typeof material.color !== 'string' || !/^[0-9a-f]{6}$/i.test(material.color)) fail(`materials.${name}.color must be a six-digit hex value without #`)
  for (const property of ['roughness', 'metalness', 'clearcoat']) range(material[property], 0, 1, `materials.${name}.${property}`)
}

if (data.lighting) {
  range(data.lighting.exposure, .5, 1.5, 'lighting.exposure')
  range(data.lighting.ambient, 0, 2, 'lighting.ambient')
  range(data.lighting.key, 0, 6, 'lighting.key')
  range(data.lighting.fill, 0, 3, 'lighting.fill')
  range(data.lighting.practical, 0, 4, 'lighting.practical')
}

if (errors.length) {
  console.error(`Checkpoint validation failed (${errors.length}):`)
  errors.forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`Checkpoint valid: ${path.relative(process.cwd(), target)}`)
console.log(`${Object.keys(data.parts).length} parts, ${Object.keys(data.materials).length} materials, lighting present`)
