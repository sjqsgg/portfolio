# V1 implementation notes (historical)

Superseded by the immersive revision in `REVISION.md`. The Lighthouse scores and original scene limitations below describe V1, not the current revision.

## Source of truth

Figma file: `mQ8AO6UcfGFPyfs2B3deXP`.

The remote MCP reader returned a Starter-plan quota error. The actual file was then inspected through the connected desktop bridge, including text, geometry, palette swatches and screenshots. Figma was read only.

- Foundations: `65:1184`
- Workbench V3: `36:16`
- Project index: `36:30`
- Project viewer: `36:52`
- Dual auto gallery: `56:698`
- Long-scroll photo series: `56:967`
- Reduced About: `56:1097`
- Persistent navigation: `56:905`
- Exported Shanxi concept image: `47:655`

The latest identity and Foundations override the older frames' name/font choices: only Jiaqi Shi appears in the new visible experience. Helvetica Neue / Helvetica / Arial is the primary voice; Noto Sans SC/JP supplies CJK fallback, with self-hosted IBM Plex Mono for metadata. The Day palette is `#f7f7f3 / #ffffff / #0b0b0a / #686862 / #c9c9c1 / #4c7a5a`; Night is `#11120f / #1a1c18 / #f1f1eb / #a9aaa2 / #363832 / #83b391`.

## Preservation and provenance

This worktree began clean at commit `974d1f1`, containing the older photography-first React/Vite site, Kanit typography, separate header/footer, EmailJS contact form, PhotoSwipe gallery, rates and draft journal. There were no models in this checkout. The approved redesign replaces its active shell while retaining the original photographs and old components. Legacy animation imports were corrected to the already-declared `motion/react` package, with unused callback variables removed so the whole repository lints.

Existing work was found in sibling worktrees:

- `7198/portfolio`: complete `workstation-graybox-v001.glb`, responsive image derivatives, descriptive photo metadata, photo component and preparation script. The earlier scene renderer provided the starting lifecycle/cleanup and GLB camera/picking contract.
- `4618/portfolio/assets/3d/workstation-graybox/v001`: original full graybox source and manifest. The reused GLB bytes are unchanged.
- `4618/portfolio/assets/3d/workstation-graybox/v002-lookdev`: focused corner study. Only its existing close-up render is used as a project chapter; the cropped GLB is not used as the full scene.

All files needed to run V1 are copied into this worktree. There are no runtime dependencies on sibling folders. No original worktree or Blender file was modified.

## Behavior

The whole site shares one sticky navigation and theme state. Theme follows the system until a choice is saved; storage failure is nonfatal. Routes reset scroll and move keyboard focus to main content. Mobile navigation supports Escape and returns focus to its trigger.

The workbench loads Three.js separately and uses the existing meter-scale GLB. The model remains stationary until dragged; orbit, zoom and panning are constrained. Monitor/camera leader lines use projected GLB anchors. The lamp and a parallel HTML control switch the same site-wide theme. Rendering is requested only when the scene changes; shader compilation is asynchronous, environment resolution is limited, pixel ratio is capped, and resources/listeners are released on unmount. Reduced motion or data-saving uses the existing static render; model timeout, parse failure or missing/lost WebGL also preserves a navigable static view.

One camera flash expands a rotating diamond/star, then fades through a soft white afterimage. Reduced motion goes straight to photography. Two gallery tracks move in opposite directions, can be paused globally, pause on hover/focus, and support pointer dragging without accidental navigation. Repeated visual copies are excluded from keyboard and screen-reader navigation. Reduced motion gives native horizontal scrolling.

A photograph URL contains stable series and image IDs. The selected image is placed first and centered, then the rest of the series follows exactly once in circular order. Invalid IDs fall back safely; missing series/projects get an explicit recovery link.

Project chapters support visible buttons, thumbnails and arrow keys. Only current work is represented, with explicit in-progress status and no fabricated results. Contact and CV request links use real mailto destinations. No form messages were sent during verification.

## Final asset work

The full graybox is earlier than the latest furniture sketch. Its conical lamp, extra cameras, upper shelving and cabinet dimensions are retained rather than silently rebuilding the user's geometry. Runtime adjustments demonstrate the green lamp, screen and night lighting; they are not a claim that final Blender look development is complete. Replace the GLB behind the named hotspot adapter once the full asset is approved. Support both existing `HOTSPOT_*` targets and any future `INT_*` names through a deliberate mapping update.

Final photo curation and per-shoot series metadata, public CV PDF, live project URLs, and expanded Shanxi Map case-study images remain replaceable content.

## Verification

Final local verification on 9 September 2026:

- ESLint passes; production build passes. Vite still reports the expected large lazy Three.js chunk (about 190 KB gzip). The primary route bundle stays separate, and photography/project pages do not load the GLB.
- Two Node data tests pass: complete selected-image ordering and existence of every published image/derivative.
- Seven Playwright browser tests pass using installed Chrome against the production build, including actual monitor/camera raycasts, route interactions and error/reduced-motion paths.
- Axe WCAG 2 A/AA and 2.1 AA checks pass across six main routes in day, night and 390px mobile configurations (18 route/view checks). These automated results supplement screenshot and interaction review; they are not a formal accessibility certification.
- Desktop (1440 × 1000) and mobile (390 × 844) screenshots show no horizontal document overflow or broken content images. Screenshots are in `docs/qa`.
- Local Lighthouse 12.8.2: desktop performance 99, accessibility 100, best practices 100, SEO 100; LCP 0.5 s, TBT 110 ms, CLS 0.004. Throttled mobile: performance 97 and the other categories 100; LCP 2.4 s, TBT 100 ms, CLS 0. These are local lab measurements, not field INP or deployed performance guarantees. The local preview has no gzip/Brotli; configure those at the host.
- Lighthouse was used temporarily and removed from the project dependencies after the reports were saved. Compatible Vite, router and tooling security patches were applied through the lockfile; `npm install` reports zero vulnerabilities after cleanup.
- Reused GLB SHA-256: `4740e18b5c489ac856c4fdacfe196a7a0466e8428103f2d0860b83a979528b74`, matching the original byte-for-byte.

`docs/qa/performance-summary.json` contains compact Lighthouse results, and the full local audit reports are retained beside it. `scripts/smoke.mjs` captures visual checks against a production preview at `http://127.0.0.1:4176` using installed Chrome.
