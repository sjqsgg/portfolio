# Jiaqi Shi portfolio

A runnable React 19 / Vite portfolio with a Three.js workbench, photography series, project pages, and a white reference-inspired site shell and resettable scene lighting.

## Run locally

Node.js 20.19+ or Node.js 22 LTS is recommended.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the localhost URL printed by Vite. For a production preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

## Verify

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

To use an already installed Google Chrome instead of downloading Chromium:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

The end-to-end suite starts a production preview on port 4175. It covers actual GLB picking, three camera views and return paths, CV/badge dialogs and focus restoration, persistent local guestbook drafts, the camera flash, themes, galleries, project chapters, mobile/reduced-motion/failure paths, and automated accessibility checks (the explicitly requested reference gray labels are recorded as known contrast findings).

## Edit content

- `src/data/photographs.js`: existing photo metadata and responsive image sources.
- `src/data/series.js`: series names, descriptions, photo membership and order.
- `src/data/projects.js`: project copy, images, chapters and optional live links.
- `src/portfolio/About.jsx`: concise biography and contact links.
- `src/index.css`: Figma Foundations typography and Day/Night tokens.
- `src/portfolio/Workbench.jsx`: lighting, camera/object animation, free orbit, model-only zoom/pan and picking.
- `src/portfolio/sceneViews.js`: the overview, work and photography preset compositions, including mobile framing.
- `src/portfolio/workspace.css`: base scene UI.
- `src/portfolio/PegboardLightbox.jsx`: borderless front view of the actual board on a dark lightbox backdrop, with outside/Escape dismissal.
- `docs/SCENE-ROUND-2026-09-09.md`: relative transition mask, object-first navigation, lower photography camera and board-view QA.
- `src/portfolio/reference-layout.css`: reference typography, gallery, About, return controls and CV lightbox.
- `src/portfolio/motion.css` and `useRouteMotion.js`: 2.15-second page transitions, shared photograph expansion/return, entry motion and the independent Contact layout.
- `docs/MOTION-ROUND-2026-09-09.md`: this motion round, timings, compatibility and QA evidence.
- `src/portfolio/CVLightbox.jsx`: CV preview, original PDF and download links.
- `src/portfolio/Home.jsx`: accessible object controls and local guestbook draft.
- `assets/3d/workstation-v003`: editable Blender source, reproducible source inputs, manifest and validation.
- `public/models/workstation-v003.glb`: complete live scene.

Original photos remain in `public/photos`. The existing optimized derivatives are reused in `public/images/photos`. To regenerate them, install Pillow and run `python3 scripts/prepare-photos.py`; edit its descriptions and source list when adding photographs.

## Routes

`/`, `/projects`, `/projects/:projectId`, `/photography`, `/photography/:seriesId?image=:photoId`, `/about`, `/contact`.

`/software` redirects to `/projects`. The earlier `/rate` and `/blog` pages remain reachable; their original content is retained. The old components remain in `src/components` for reference. The new implementation lives in `src/portfolio`.

## Workstation asset

The current scene is a complete, independent v003 Blender derivative. It keeps the physical 90° L, 740 mm work surface and 28 mm tops, with fewer cameras, a photography-side guestbook, a separate CV rack, badge/guestbook pivots, smoothed equipment, wood texture, green enamel and distinct paper/metal/leather/cloth materials. The original v001 model remains available and untouched.

Regenerate using Blender 4.1+ from this repository (all source inputs are included):

```sh
blender --background --python scripts/build-workstation-v003.py
node scripts/validate-workstation.mjs
```

`sceneViews.js` defines the three preset camera compositions. Free orbit, pan and model-only zoom remain available. The renderer animates camera position, target, field of view and projection offset together. The workstation model is only requested on the home route; reduced motion/data saving and failed WebGL use matching responsive scene renders. The board model is loaded on demand only when its close view is explicitly opened. No still-view toggle is exposed.

Guestbook notes are local drafts. “Open in email” prepares a mailto link; the site does not send or publish notes.

## Remaining editorial inputs

The 19 existing photographs are divided into two replaceable editorial groups. Final series selection, titles, dates and captions are still editorial work; no camera settings or precise shoot dates have been invented. Shanxi Map uses the actual Figma concept visual, explicitly labeled as a concept study. No unverified live URL, GitHub URL or project outcome is published. The supplied CV is available in a preview lightbox with an original-PDF download; About downloads it directly.

Pushes to `main` deploy automatically to GitHub Pages. The workflow builds with the `/portfolio/` base path and publishes an SPA fallback while local development continues to use `/`.

See `docs/HIROTO-REVISION-2026-09-09.md` for the current reference-layout/CV/controls revision and verification. `docs/REVISION.md` records the preceding workbench revision. `docs/IMPLEMENTATION.md` records the historical V1 implementation and measurements.
