# Workstation opening and image synchronization

Confirmed on 2026-10-08: replace all active old workstation images, then open
with a small workbench, a gentle brightness breath during real loading, and a
smooth approach to the existing normal overview. Preserve the accepted scene
geometry, material baseline and saved board layout behavior.

## Opening sequence

- `loading`: the current scene's small preview fades in over 550ms; a 2.6s
  opacity cycle varies from 1 to .76. No artificial progress percentage.
- `revealing`: the first successfully rendered WebGL frame is ready at the
  same miniature camera pose; the picture/backdrop fade away over 240ms.
- `entering`: the real camera approaches the ordinary overview over 950ms,
  with cubic deceleration. Navigation and the corner text fade in during it.
- `done`: all scene interactions are enabled; the normal camera preset is
  unchanged. Returning Home does not replay the first-visit entrance.
- `fallback`: model/WebGL failure reveals the current static view and releases
  navigation. The renderer's actual 25s load timeout reports failure; there
  is no five-second timer reporting false readiness.

The header identity stays in place. Reduced motion skips the loader and WebGL.
Data saving uses the static views. Desktop and mobile use separate miniature
captures, with the same camera settings used by the live renderer.

`/?intro-preview=1` in Vite development mode delays the handoff by four seconds
after the scene becomes ready so the brightness cycle can be judged. The
production build ignores this switch.

## Active image sources

`npm run posters:generate` owns its Vite server on port 5192 and fresh browser
contexts. It does not use local owner drafts or apply the saved
`board-objects-checkpoint.json` as a new runtime default.

It captures the scene after `workstation-current.json` and current board
defaults have been applied, then encodes the browser frames as WebP:

- `overview`, `work`, `photo`, each with `day` and `mobile` variants.
- `intro-day` and `intro-mobile` at the opening camera distances.
- `cover-day`, showing the full current workbench for Projects and its detail.
- `posterAnchors.css`, projected alongside the current images. Image sizes
  and horizontal hotspot positions both follow viewport height, like the
  perspective camera, so changing aspect ratio keeps them aligned.

The portfolio's Materials chapter uses the current work view. The old
`workstation-1584.webp` and `material-study.png` are no longer referenced by
the running site; archival assets and historical QA evidence remain available.

The generated `workstation-posters.json` records source and output hashes.
`npm run posters:check` runs before builds and rejects missing, modified or
stale derivatives. Regenerate after changing the baseline, camera, model,
renderer, board construction/defaults, or relevant scene layout styles.

## Verification

Use the loader browser tests for the real camera handoff, slow model requests,
failed downloads, unavailable WebGL and reduced motion. Check the actual
desktop/mobile frames as well as the data tests and source manifest. The
manifest proves which inputs generated a file; visual comparison verifies
the capture itself is correct.

Verified on 2026-10-08:

- Production build and current-asset validation pass; 11 data/board tests and
  24 loader, portfolio and route-transition browser tests pass.
- Lint has no errors; the existing `CVLightbox.jsx` Fast Refresh warning remains.
- Desktop (1600×900) and mobile (390×844) recordings have no page errors.
  The miniature poster/live-frame comparison has mean RGB channel differences
  of 3.74 and 2.16 out of 255 on visible scene pixels, respectively.
- An isolated fixture confirms that the build guard accepts current images
  and rejects both changed camera sources and a missing preview image.
- Geometry, camera presets, the formal baseline JSON and board defaults have
  no changes. The preview is local; this work has not been deployed.
