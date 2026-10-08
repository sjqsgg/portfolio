# Workstation opening and image synchronization

## Current design

The owner selected black `Loading...` lettering on the same white background
as Home, replacing the miniature workstation entrance. The shared Helvetica
font stack, generous whitespace and restrained domino motion preserve the
portfolio's typography. The current letter motion remains a native CSS
interpretation of the Domino Lettering reference. The owner confirmed they
do not currently have React Bits Pro access and requested that only the
loading layout and transition be changed for now; importing the original
component is deferred. No Pro source or license has been installed.

- `loading`: live text fades in over 240ms. Each letter tips right, rests,
  rises with one small rebound, and settles. The 3s loop staggers letters by
  70ms; it runs only while the actual scene is preparing. The name, navigation,
  corner details, skip link and custom cursor are hidden in this phase.
- `revealing`: the first successfully rendered WebGL frame, or a decoded
  fallback image, starts the existing curved page transition. The browser
  captures the loading page, removes it, then runs the same darkening, curved
  curtain and content arrival used by route changes. No wait for the letter
  loop to finish. Reduced motion skips the transition, and unsupported
  browsers use the existing route fade fallback.
- `done`: the ordinary overview and scene interactions are available.
  Returning Home does not replay the first-visit entrance.

The loader uses real text, with no image, additional font download or WebGL
renderer of its own. The real scene starts at its normal camera preset.
`routeTransition.js` shares the original desktop/portrait mask setup and
CSS timing with `useRouteMotion` and `useEntranceMotion`. The latter keeps
the page inert until the transition finishes and releases its resources
when interrupted by navigation.

The previous four-second `intro-preview` hold and miniature camera approach
are removed. Reduced motion skips the loader and WebGL. Data saving and
model/WebGL failure retain current static views. Screen readers receive one
stable loading status; decorative letter spans are hidden from them.

## Active image sources

`npm run posters:generate` owns its Vite server on port 5192 and fresh browser
contexts. It does not use local owner drafts or apply the saved
`board-objects-checkpoint.json` as a new runtime default.

It captures the scene after `workstation-current.json` and current board
defaults have been applied, then encodes the browser frames as WebP:

- `overview`, `work`, `photo`, each with `day` and `mobile` variants.
- `cover-day`, showing the full current workbench for Projects and its detail.
- `posterAnchors.css`, projected alongside the current images. Image sizes
  and horizontal hotspot positions follow viewport height, like the
  perspective camera, so changing aspect ratio keeps them aligned.

The Materials chapter uses the current work view. Historical concept images
and the previous `intro-day` / `intro-mobile` images have no active runtime
references. They remain archived alongside historical QA evidence.

`workstation-posters.json` records source and output hashes.
`npm run posters:check` runs before builds and rejects missing, modified or
stale derivatives. Regenerate after changing the baseline, camera, model,
renderer, board construction/defaults, or relevant scene layout styles.
Loader-only styling does not invalidate scene images.

## Verification

The loader browser tests cover the normal-size handoff through the existing
curved transition, loading-only content, no preview requests, desktop/mobile
domino motion, background matching, slow requests, failed downloads, missing
WebGL, reduced motion, data saving and the no-View-Transitions fallback. Verify letter rhythm visually alongside these behavioral checks.
