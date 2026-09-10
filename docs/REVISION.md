# Immersive workbench revision — 9 September 2026

## Current result

The active shell is a fixed corner overlay shared by all routes. The supplied Hiroto Sato screenshot informed the upper-left muted sans-serif role line, bold uppercase identity, right-aligned vertical navigation, and lower-left BASE rule. The layout is adapted to Jiaqi Shi's longer role line and extra Photography destination. The Foundations day/night colors remain authoritative. There is no horizontal header bar, active-item bullet, Build things / Frame moments hero, or user-facing Still view switch.

The home page presents three camera compositions:

| View | Purpose | Object paths |
| --- | --- | --- |
| 01a | Close overview, with foreground chair/desk cropped | Monitor → 01b; camera → 01c; lamp → day/night |
| 01b | Monitor and pegboard | Monitor → projects; CV lifts out of its rack; badge flips and comes forward |
| 01c | Cameras, lenses, personal objects and guestbook | Camera → photography flash; guestbook lifts off its stationary stand and opens for writing |

Position, target, FOV and projection offset transition together. Bounded orbit remains available between transitions. Each detail view has a return action and a persistent three-view selector. Closing a document places the object back, restores the camera composition, and restores keyboard focus to its trigger. Native modal dialogs supply focus containment and Escape behavior.

The guestbook stores a draft on the current device. The email link prepares the draft in the visitor's email app. No messages are automatically sent, published or stored on a server. The CV sheet links to selected work and a CV request; a public PDF has not been fabricated.

## Asset delivery

- Complete current runtime model: `public/models/workstation-v003.glb` (3,696,948 bytes; 68,591 triangles; 175 meshes).
- Editable source: `assets/3d/workstation-v003/jiaqi-workstation-v003.blend`.
- Rebuild script: `scripts/build-workstation-v003.py`; all source inputs are included in `assets/3d/workstation-v003/sources`.
- Structural report: `assets/3d/workstation-v003/validation.json`.
- The physical 90° L, 0.74 m work surface and 28 mm tabletop thickness are retained. Camera count is reduced, the guestbook is moved into the photography zone, the chair is moved forward, and a separate CV paper/rack is added. The badge peg and guestbook stand remain stationary while their objects move.
- Edge radii and corrected surface normals, pale ash texture, chrome, green enamel, dark camera leather/metal/glass, speaker wood/cloth and paper variations are included. Runtime lighting adds softened shadows, a studio reflection environment and a warm practical lamp at night.
- Original v001 assets and all sibling worktrees remain unchanged. The v002 pale-ash texture is reused; the cropped v002 scene is not substituted for the complete workstation.

Reduced motion, data-saving, failed model loading and missing WebGL use matching responsive renders of these same cameras. Labels use projected positions captured alongside the posters. Rebuild them using a preview on port 4176 and `node scripts/capture-scene-posters.mjs`, then convert the generated PNGs to WebP at the corresponding public paths. The scene canvas remains hidden from assistive technology; equivalent HTML controls expose all primary interactions.

## Validation

The following commands passed on the current revision:

```sh
npm run lint
npm test
npm run build
node scripts/validate-workstation.mjs
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
node scripts/scene-qa.mjs
node scripts/smoke.mjs
```

- Two Node data tests pass.
- Nine Playwright tests pass, including actual mesh raycasts, camera transitions/return, themes, flash, CV/badge focus restoration, guestbook persistence, gallery movement/drag/order, project routes, reduced motion and model/WebGL failure.
- Axe WCAG 2 A/AA and 2.1 AA checks return no violations for 18 route/theme/viewport combinations, plus the three document dialogs.
- Visual review covers all three scene cameras at 1440×1000 and 390×844, day/night, open documents, and content pages. Smoke checks report no horizontal page overflow or broken content images.
- Screenshots for the current scenes and documents are under `docs/qa/v2`; current content-page captures are under `docs/qa`.
- Vite reports its existing large lazy Three.js chunk (about 190 KB gzip). The renderer and 3D asset load only for the live home scene. Earlier Lighthouse scores in `IMPLEMENTATION.md` are historical V1 results and have not been relabeled as measurements of this revision.

Run `npm run build` followed by `npm run preview -- --host 127.0.0.1 --port 4176` for the reviewable production preview. No deployment was performed.
