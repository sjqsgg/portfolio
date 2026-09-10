import { photographs } from './photographs.js'

// Editorial groupings of the existing archive. Replace membership and captions here.
const byId = id => photographs.find(photo => photo.id === `portrait-${String(id).padStart(2, '0')}`)
export const series = [
  { id: 'portraits', title: 'Portraits', description: 'Soft light, color and unguarded moments.', location: 'Amsterdam & elsewhere', photos: [1, 2, 3, 4, 5, 6, 7, 9, 11, 14, 18, 19].map(byId) },
  { id: 'selected-moments', title: 'Selected moments', description: 'Small pauses between movement and stillness.', location: 'From the personal archive', photos: [8, 10, 12, 13, 15, 16, 17].map(byId) },
]

// Keep every photograph exactly once; the selected image starts a circular reading order.
export function orderedPhotos(photos, selectedId) {
  const index = Math.max(0, photos.findIndex(photo => photo.id === selectedId))
  return [...photos.slice(index), ...photos.slice(0, index)]
}
