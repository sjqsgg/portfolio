// One uniform scale multiplies the complete model, including small details.
export function maxObjectScale(item) {
  return Math.min(3, .4 / item.width, .34 / item.height, .2 / item.depth)
}

export function scaleBoardObject(item, factor, anchor = item) {
  const initialScale = item.scale || 1
  const scale = Math.max(.1, Math.min(maxObjectScale(item), initialScale * factor))
  const applied = scale / initialScale
  return { scale, x:anchor.x + (item.x - anchor.x) * applied, y:anchor.y + (item.y - anchor.y) * applied }
}

export function resizeBoardObject(item, start, point, anchor, locked = true) {
  const dx = start.x - anchor.x, dy = start.y - anchor.y
  if (locked) {
    const length = dx * dx + dy * dy
    if (length < 1e-10) return scaleBoardObject(item, 1)
    return scaleBoardObject(item, ((point.x - anchor.x) * dx + (point.y - anchor.y) * dy) / length, anchor)
  }
  const scale = item.scale || 1
  const width = Math.max(.008, Math.min(.4 / scale, item.width * Math.max(.01, (point.x - anchor.x) / dx)))
  const height = Math.max(.008, Math.min(.34 / scale, item.height * Math.max(.01, (point.y - anchor.y) / dy)))
  return { width, height, x:anchor.x + (item.x - anchor.x) * width / item.width, y:anchor.y + (item.y - anchor.y) * height / item.height }
}
