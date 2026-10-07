# Felt board objects

Local owner preview: `http://127.0.0.1:5174/?boardedit=1` after starting `npm run dev -- --host 127.0.0.1 --port 5174`.

This is an additive object layer. `docs/workstation-current.json` is unchanged and remains the accepted workstation/material/board baseline. The main workstation and enlarged board consume the same object store and model factory.

## Included

- Intact scratch card: pointer/touch rubbing erases a separate silver canvas layer. Marks persist; Recoat and keyboard Reveal are available. Fictional souvenir, no prize or payment.
- Keychain: independent carabiner, gate, sleeve, rings, four keys, and round tag. Pivot-based damped movement for 2.2 seconds; no continuous idle animation. Respects reduced motion.
- Boarding pass and baggage stub: printed recreation inspired by the supplied photo; dummy barcode and souvenir label, no original ticket identifier.
- Open box with an irregular, overflowing pile of pushpins on the tray. Click to take a standalone pin. The supplied Tripo arrangement and slightly open lid are retained; the isolated front sticker is removed.
- Ten-layer paper stack on the tray. Click to compose a local note and pin it to the board.

Paper, individual pins and keys are procedural Three.js meshes. The pushpin box uses `public/models/board-pushpins.glb`, a matte, simplified derivative of the supplied GLB (39,198 triangles / 725,988 bytes). Original source is unchanged. Reproduce with Blender and `scripts/prepare-board-pushpins.py`; the report is `docs/board-pushpins-model.json`. Box, lid and nine pin-cluster meshes are recolored at runtime. Some lower pins are fused into the box in the supplied segmentation and therefore share its color; these are not claimed to be individually editable.

## Editing and persistence

Saved work-in-progress checkpoint (2026-10-07): `docs/board-objects-checkpoint.json`, copied from the owner's `assets/3d/felt-board-layout.json` export. All five objects and their positions, dimensions, scales, colors and permissions are preserved. This is a recoverable layout snapshot, not a replacement of the published defaults or workstation baseline; it can be loaded using Paste layout JSON / Import layout. No push or deployment is implied by saving this checkpoint.

Object studio is development-only (`boardedit=1` or `lookdev=1`, then open the board). In Arrange mode click an object or use Selected object to select it; a screen-aligned outline with four corner handles appears. Drag inside to move, drag a corner to resize, or use Scale (%) and Smaller/Larger. Lock proportions is enabled by default: the complete model and its details scale together. Unlock to stretch width/height independently. Corner handles also accept arrow keys in 5% increments. Interact mode hides editor handles and retains scratch/key/supply interactions.

The inspector supports position, effective dimensions, rotation, tilt, off-board distance, paper curl, pin size/key spread, note text, visibility, visitor movement permission, duplication and removal. The pin box has five color controls: box, lid, and three pin-cluster colors. Layout records include `scale`, `lockAspect`, `lidColor`, `pinColor2`, and `pinColor3`; old layouts without these fields still import. JSON export/import validates type, dimensions, positions, IDs and scratch data, with a 40-object cap. Only an untouched old procedural-box draft is migrated to the new box dimensions/colors; custom owner edits are preserved.

Owner draft: `jiaqi-board-objects-owner-v1`. Visitor draft: `jiaqi-board-objects-visitor-v1`. They are intentionally separate. No upload, public guestbook or shared visitor state is implemented. Storage failure is reported and owner JSON export remains available. Reset restores the five defaults, clearing local notes and scratch marks.

To promote an accepted layout later, use Export layout and update `boardObjectDefaults` in `src/portfolio/boardObjectsStore.js`. Do not silently merge a visitor draft into the published defaults. No deployment or Git push is part of this delivery.

## Verification

`npm test` includes object validation, default inventory, independent key pivots/settling, imported model structure, color edits, independent resource disposal, anchored proportional resize, unlocked stretching, scaling bounds and JSON round trips. `npm run build` and `npm run lint` validate the application (the pre-existing CVLightbox refresh warning remains).

Manual browser checks: scratch with mouse, create a multilingual note, reload persistence, key dragging, width editing, reset, and 390px mobile panel layout. The editor and main view share updates through the store. Visitor changes are local only.
