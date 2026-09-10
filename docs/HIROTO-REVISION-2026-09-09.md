# Hiroto reference layout, CV and scene controls

This revision implements the user's confirmed 9 September changes. The source reference remains at `docs/references/hirotos/2026-09-09/REFERENCE.md`; the earlier `REVISION.md` is historical.

## Delivered behavior

- Photography retains both independent horizontal rows. Their heading rules are removed. Cards use the reference regular, portrait and wide size formulas, `clamp(14px,2.1vw,32px)` spacing, cover crops and restrained hover scaling. Two reference-sized rows can exceed a short viewport; the page remains scrollable.
- Non-home routes show the black circular home link. The user's extra Photography destination remains in the navigation. Identity and BASE belong to Home, preserving the reference About layout.
- Identity uses Helvetica Neue LT Pro Medium, 500, `max(24px,2.8vw)`, line-height .98, no negative tracking. Adobe's reference stylesheet is loaded in index.html; system Helvetica Neue/Helvetica/Arial are fallback fonts if that external service is unavailable.
- Default canvas is pure white. BASE is transparent and can overlap the model. Updated static posters use the same white backdrop and current cameras.
- Canvas wheel/pinch zoom changes the Three.js camera, without scaling the HTML page. Left drag freely orbits through all azimuths and the full polar range; right drag pans. Touch uses one-finger rotation and two-finger zoom/pan. Distance bounds .2–20 avoid unusable camera distances; the previous narrow angle clamps are removed. Gestures are consumed only in the scene, preserving native browser zoom elsewhere.
- Revert replaces the bottom-right day/night icon. It returns to overview, resets position/target/FOV/projection offset and lifted objects, and restores day lighting. Lamp interactions remain available; a fresh load starts in day mode.
- The exact supplied PDF is copied to `/documents/jiaqi-shi-cv-2026.pdf`, SHA-256 `4dbab198e5c0376b637b776aa72707bcb8a3865f4db4b0cc7831baace406f098`. Home's CV object opens a native modal with an accurate one-page raster preview, a download icon, and an Open PDF link for selectable text. Escape/backdrop/close restore the trigger. The scrollable preview has keyboard focus. About's Download my CV downloads the same original file directly.
- About keeps Jiaqi's content and uses the reference title/body widths, font formulas, line heights, borders, margins, grid and 620px mobile breakpoint. Its shorter copy naturally produces a different total block height from Hiroto's; no filler text or Japanese-language switch was added. CV is a third contact-column link, avoiding an extra footer layout.

## Verification

- `npm run lint`, `npm run build`, `npm test` pass (2 data tests).
- All 11 Playwright tests pass. The full regression covers scene picking, views, lamp/flash, documents and focus, guestbook, galleries, project pages, mobile/static/failure paths, free zoom/orbit/pan, Revert and both CV downloads.
- The explicitly matched small gray labels from the reference have known color-contrast findings. The accessibility test records these exact selectors/colors; all other rules/elements remain asserted. This is not a claim of complete WCAG AA compliance.
- CDP confirms the loaded font is **HelveticaNeueLTPro-Md** on both 1512×820 and 390×844.
- Real Chromium touch events changed camera distance from 4.98984 to 2.62623 while visualViewport.scale remained **1**; there was no accidental object activation or navigation. Safari gesture support is implemented, but a physical Safari/trackpad session was not tested.
- Browser QA captured no page errors. Original and served PDF hashes match.
- Latest screenshots and measurements: `docs/qa/hiroto-revision/`. `verified.json` contains fonts, touch results, About measurements and PDF hash.

## Review

Local production preview: http://127.0.0.1:4176/ . No deployment or new motion redesign is included. The user will review this layout/control pass before discussing further motion changes.
