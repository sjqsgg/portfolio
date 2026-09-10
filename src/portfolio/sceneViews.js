// Preset compositions in glTF coordinates (meters, Y up). Free orbit remains available.
export const sceneViews = {
  overview: { position: [2.75, 2.5, 3.85], target: [-.04, 1.12, -.05], fov: 25, mobileFov: 41 },
  work: { position: [.75, 1.8, 1.65], target: [-.58, 1.09, -.28], fov: 37, mobileFov: 53 },
  photo: { position: [.28, 1.10, .78], target: [.28, .84, -.66], mobilePosition: [.10, 1.10, .78], mobileTarget: [.10, .84, -.66], fov: 34, mobileFov: 49 },
}
export const hotspotNodes = { monitor: 'HOTSPOT_monitor', camera: 'Camera_Mirrorless', lamp: 'Lamp_Shade', cv: 'HOTSPOT_cv', badge: 'HOTSPOT_badge', guestbook: 'HOTSPOT_guestbook', board: 'Pegboard_Perforated_21x14', film: 'Camera_Film', lens: 'Lens_Standalone_01', mug: 'Ceramic_Mug_Base', audio: 'Central_Audio_Module' }
