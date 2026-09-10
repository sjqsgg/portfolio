const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')

export function assetPath(path) {
  return path.startsWith('/') ? `${base}${path}` : path
}

export function assetSrcSet(srcSet) {
  return srcSet.split(',').map(candidate => {
    const [url, ...descriptor] = candidate.trim().split(/\s+/)
    return [assetPath(url), ...descriptor].join(' ')
  }).join(', ')
}
