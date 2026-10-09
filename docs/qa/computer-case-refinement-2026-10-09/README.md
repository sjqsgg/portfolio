# Computer case refinement — 9 October 2026

The user approved simplifying the current case's internals while preserving its fitted size, position, glazed-side orientation and the corrected wooden bay panels. This local candidate replaces the single generated photographic mesh with independent hard-surface parts: a motherboard silhouette, CPU pump, two RAM bars, horizontal graphics card, power-supply shroud, three framed radiator fans, rear fan, two smooth coolant runs and three ordered power cables. Small board components and photographic surface detail are omitted.

The accepted shell rails and glass are retained. Internal surfaces use five independently adjustable solid-colour materials: warm white, satin silver, muted sage, soft dark recesses and ivory tubing. No colour or normal maps remain on the internals.

## Review images

- `before-closeup.png` / `after-closeup.png`: the oblique close view, with the desk edge in front.
- `before-side.png` / `after-side.png`: the glazed side viewed directly.
- `before-low.png` / `after-low.png`: a lower angle that exposes the fans, pump and tubing.
- `before-overview.webp` / `after-overview.webp`: the accepted desktop opening view.
- `before-mobile.webp` / `after-mobile.webp`: the accepted mobile opening view.

The PNG comparisons use the actual website renderer, production lighting and checkpoint settings. A temporary Vite transform exposes the camera for capture without adding a debug API to the application. The before model is read from the preceding Git commit; the after model is the local candidate. The comparison uses identical viewport and camera settings, with the UI labels hidden.

## Reproduction

1. Run `scripts/build-computer-case-production.py` using Blender 4.1 in background mode with factory startup. The tracked standalone production Blender scene supplies the unchanged shell and glass; the script replaces only its internal assembly and writes the standalone GLB.
2. Run `node scripts/replace-computer-case.mjs` to replace the tower subtree in the website GLB. It compares all 207 non-computer scene nodes, including geometry and texture byte payloads, before writing the result.
3. Run `node scripts/validate-workstation.mjs` to check the case envelope, speaker clearance, bay panel placement, required components and the absence of photographic/normal textures on internal materials.
4. Run `npm run posters:generate` and `npm run build` to update all desktop/mobile fallback images and verify their source fingerprints.

The full workstation Blender scene also contains the same replacement assembly. Original imported reference models are preserved. These comparisons record the initial clean assembly before the later palette and layout edits. The latest accepted values live in `docs/workstation-current.json`, with console captures in `docs/qa/computer-case-console-2026-10-09`. The user approved pushing the combined change after reviewing that checkpoint.

## Verification

- Workstation asset validator: passed, including upright alignment, fitted case dimensions and clean internal materials.
- Scene replacement: all 207 non-computer objects preserved, including their binary geometry and texture payloads.
- Desktop/mobile fallback capture and source fingerprint validation: passed.
- Production build: passed, with the existing bundle-size advisory.
- Targeted ESLint and whitespace checks: passed.
- Existing browser checks for actual monitor/camera mesh clicks and full scene orbit, pan, zoom and Revert: 2 passed.
