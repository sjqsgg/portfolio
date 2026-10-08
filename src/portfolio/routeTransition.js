const routeCurveSamples = [
  [100,100],[97.3801,100],[94.3294,100],[90.0583,100],[84.8267,100],[79.0643,100],[73.2009,100],[67.3147,98.7112],
  [60.9938,94.0101],[54.4305,86.8],[47.8376,78.0714],[41.428,68.8147],[35.4146,60.0203],[29.714,51.8118],
  [23.5356,41.9156],[17.3117,31.2273],[11.5988,20.9875],[6.9533,12.4364],[3.9316,6.8145],[2.8271,4.8442],
  [2.1494,3.6829],[1.5673,2.6856],[1.0809,1.8521],[.6902,1.1827],[.3952,.6772],[.196,.3358],[.0925,.1585],
  [.0579,.0992],[.036,.0617],[.0189,.0324],[0,0],
]

// Shared setup for route changes and the initial Loading → Home handoff.
export function prepareRouteTransition(kind = 'page') {
  const style = document.documentElement.style
  // Desktop keeps the archived square path. Portrait screens use a taller
  // offscreen axis so the curtain starts below the viewport instead of
  // appearing halfway up the page.
  const portrait = innerHeight > innerWidth
  const maskAxis = portrait ? innerHeight * 1.45 : Math.max(innerWidth, innerHeight)
  const mask = (edge, control, unit = 'vmax') => {
    const curve = Array.from({ length:65 }, (_, i) => {
      const t = i / 64
      const y = edge + 2 * t * (1 - t) * (control - edge)
      return `${100 * (1 - t)}% ${unit === 'px' ? y * maskAxis / 100 : y}${unit}`
    })
    return `polygon(0% 0%,100% 0%,${curve.join(',')})`
  }
  const supportsShape = CSS.supports('clip-path', 'shape(from 0% 0%,line to 100% 0%,line to 100% 100vmax,curve to 0% 100vmax with 50% 100vmax,close)')
  style.setProperty('--route-mask-start', mask(100, 100))
  style.setProperty('--route-mask-0124', mask(94.660155, 100))
  style.setProperty('--route-mask-0403', mask(72.053887, 100))
  style.setProperty('--route-mask-0805', mask(33.252319, 56.97056))
  style.setProperty('--route-mask-1205', mask(3.172123, 5.435398))
  style.setProperty('--route-mask-1702', mask(.083869, .143691))
  style.setProperty('--route-mask-end', mask(0, 0))
  let geometryStyle
  if (portrait) {
    geometryStyle = document.createElement('style')
    geometryStyle.dataset.routeGeometry = ''
    geometryStyle.textContent = `@keyframes route-curve-portrait{${routeCurveSamples.map(([edge, control], frame) => `${(frame * 100 / (routeCurveSamples.length - 1)).toFixed(3)}%{clip-path:${mask(edge, control, 'px')}}`).join('')}}`
    document.head.append(geometryStyle)
  }
  document.documentElement.dataset.routeMotion = kind
  document.documentElement.dataset.routeMask = portrait ? 'portrait' : supportsShape ? 'shape' : 'polygon'
  document.documentElement.dataset.routeEntering = 'true'
  return () => {
    geometryStyle?.remove()
    delete document.documentElement.dataset.routeMotion
    delete document.documentElement.dataset.routeMask
    delete document.documentElement.dataset.routeEntering
  }
}

export function routeTransitionDuration() {
  const css = getComputedStyle(document.documentElement)
  const milliseconds = value => value.trim().endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000
  return milliseconds(css.getPropertyValue('--route-text-delay-base') || '1.177s') + milliseconds(css.getPropertyValue('--route-text-duration') || '.76s')
}
