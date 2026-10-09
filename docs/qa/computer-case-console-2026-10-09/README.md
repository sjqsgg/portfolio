# Computer case console — 9 October 2026

The latest supplied draft (revision `computer-case-2026-10-09-03`) is now the default in `docs/workstation-current.json` and is archived verbatim in `docs/checkpoints/computer-case-approved-2026-10-09.json`. The prior draft is preserved as `computer-case-approved-2026-10-09-02.json`. All colours, surface properties and component dimensions/positions are applied exactly as supplied: glass 543.2 × 496.4 × 8.6 mm at Z offset −56 mm, GPU Z offset −124 mm, power-cable middle Z offset +16 mm, internal panels `bbd095`, tubing `d5ddc6`, audio −10 mm and speakers −40 mm vertically. Glass roughness 0.36, metalness 0.78 and opacity 0.2 remain unchanged. Shell and accent opacity are now both zero; opacity controls include zero so the sliders match the imported values.

Start the development server and open `/?lookdev=1&panel=computer`. The new **机箱** tab shares the established look-development inspector. Its controls provide:

- Eight independently editable colours, with colour pickers and HEX entry; roughness, metalness and opacity per material.
- Twenty-two part groups: shell, accent, glass, back panel, bottom plate, top panel, rear spine, front intake frame/channels, graphics card, motherboard, CPU pump, two RAM bars, power-supply shroud, radiator assembly, three radiator fans, rear fan, two coolant tubes and the graphics-card power cable bundle.
- Material selection links to the actual corresponding parts. For a shared material, choose the specific part in **对应部件**, then click **调整对应部件的尺寸与位置**. Dimensions affect the selected assembly; surface edits affect all meshes sharing the material.
- Solid-part dimensions and position offsets in millimetres, plus rotation in degrees. Fans move with the radiator while retaining independent dimensions.
- Tube diameter and middle-route offsets. Coolant endpoints follow the CPU pump and radiator; power cable endpoints follow the GPU and shroud. Reset returns to this latest accepted layout, rather than the earlier raw model dimensions.
- Close and whole-workstation views, per-part and whole-case reset, local save, JSON export and import. The ordinary page has no inspector.

`Save draft` stores the current settings on this browser. `导出参数` downloads the complete workstation draft, including `computer: { version: 1, parts: ... }`; `Import draft` restores it. Older drafts without `computer` remain valid and use the current accepted internal layout. Drafts record `baselineRevision`; a saved draft from an earlier baseline remains in local storage but is not automatically overlaid on newly accepted defaults. Explicit import accepts it and records the current revision. To make a reviewed layout the default later, copy its `computer` object into the current checkpoint and increment its revision. Geometry transforms and attached routes then apply on the ordinary page as well.

The console permits deliberate overlaps and movement outside the case; it does not automatically pack parts or detect collisions. Dimensions are measured along the case's X/Y/Z axes before additional rotations. Layout edits preserve the accepted geometry at default values, and colours remain independent of layout.

## Verification

- Five geometry tests use the actual production GLB to verify unchanged raw geometry, millimetre dimensions, nested fan sizing, attached endpoints, outer-surface transforms, save/import round trips and exact preservation of the user's accepted draft. Bay panels and internals remain fixed when resizing exterior parts.
- Three browser tests cover desktop/mobile controls, the supplied palette and layout, save/reload/export/import/reset, material-linked geometry controls, stale-draft preservation and the absence of controls on the ordinary page.
- `desktop.png` shows the supplied palette and accepted layout; `mobile.png` shows the part controls in a narrow viewport; `outer-surfaces.png` shows the new glass dimension controls.

All 26 unit tests and the three console browser checks passed. Browser checks used the installed Chrome with `PLAYWRIGHT_CHANNEL=chrome npm run test:lookdev`; bundled headless Chromium stalled during loading on this Mac. The same optional channel setting is supported by poster capture. The development-only console tests have their own Vite-backed Playwright configuration; the ordinary production preview suite excludes them.
