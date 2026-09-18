# Workstation lookdev — round 02 brief

Started: 2026-09-18

Status: active

Baseline: [checkpoint 01 — Lighter, less crowded](./workstation-lookdev-round-01.md)

## Primary question

After reducing the audio zone, do the remaining large forms create a believable adult workstation with a clear silhouette and enough negative space, without losing the strong spatial composition?

## Allowed variables

Only structure parameters for these parts may change:

- `Main desktop`: width, height and length with visual-centre lock enabled.
- `Rear unit` and `Rear counter`: overall width, height and length where needed to improve the relationship between upper and lower masses.
- `Upper storage`: width, height and length.
- `Chair`: width, height, length and position only when required for clearance or the intended low Isabelle placement.
- `Wall board`: width, height, length and position. This round judges the panel's mass only; its current perforated geometry is a placeholder for felt.

Position changes require an explicit clearance or composition reason. Rotation is frozen unless a collision cannot be assessed without correcting an obviously accidental orientation.

## Frozen variables

- Checkpoint 01 audio module, left speaker, right speaker and rear-frame values.
- All checkpoint 01 colours, roughness, metalness and clearcoat values.
- Neutral checkpoint 01 lighting.
- Main frame construction, tube language and bevels; these belong to round 03.
- Cameras, monitor, lamp, books and other small props.
- Board surface construction and contents. The future felt board keeps only the scratch card in its first detailed pass.
- Isabelle modeling and visibility; the chair must merely preserve space for her original compact proportions.

## Reference evidence

- [Homepage V2 confirmed overrides](./homepage-v2-design-spec.md#confirmed-overrides--17-september-2026)
- [Checkpoint 01 assessment and parameters](./workstation-lookdev-round-01.md)
- The user-reviewed checkpoint 01 screenshot from 17 September 2026.

No new style reference is introduced in this round.

## Acceptance criteria

1. The 740 mm work surface still reads as adult furniture; the desktop cannot become thin or shallow enough to feel miniature.
2. The upper storage supports the composition without becoming the dominant solid block.
3. The rear counter, upper storage and board leave visible breathing room instead of forming one continuous wall.
4. The chair has credible clearance from the desk and audio cabinet and can later conceal most of compact Isabelle without becoming oversized.
5. The board has a deliberate proportion suitable for felt and does not rely on holes or hanging objects for visual interest.
6. The board envelope meets the right backing panel cleanly; no unintended white slot is visible between the two surfaces.
7. The accepted checkpoint 01 audio spacing remains visibly calmer than the original scene.
8. Overview, Work and Photography views retain their main interactive objects inside usable framing on desktop.
9. No colour, material or lighting change is used to disguise a proportion problem.

## Candidate strategy

- **A — Baseline:** checkpoint 01 unchanged.
- **B — Airier upper band:** test a modest reduction in Upper storage height/depth and, only if needed, Wall board size.
- **C — Board envelope alignment:** build on B by closing the newly identified gap between the board and the right backing panel. Position or width may change only by the amount needed to close that seam. Main desktop, Rear unit and Chair stay frozen unless a separate, named defect is demonstrated.

Candidates are compared under identical camera and neutral lighting. B or C may be rejected; there is no requirement to change every allowed part.

## Required outputs

- Fixed-view baseline and selected-candidate captures for Overview, Work and Photography.
- A new `workstation-lookdev-round-02.json` containing checkpoint 01 plus accepted round 02 values.
- A round 02 decision record classifying every tested value as accepted, provisional or rejected.
- Automated checkpoint, model, lint, unit and build gates before completion.

## Candidate B observation — 2026-09-18

Tested values:

- `Upper storage`: height `0.90`, length/depth `0.92`; width and position unchanged.
- `Wall board`: width `0.94`, height `0.92`; depth and position unchanged.
- All checkpoint 01 audio, surface and lighting values remained frozen.

The Overview, Work and Photography fixed views were inspected. The upper band has slightly more air while the desktop continues to read as adult furniture. The close Photography view still gives the board strong visual weight because of camera distance, but this is not evidence for another scale reduction. Main desktop, Rear unit and Chair have no demonstrated problem requiring a change yet.

Classification: **provisional** pending user comparison. Candidate C is not authorized unless the comparison reveals a named proportion or clearance defect.

Reproducible parameters: [`workstation-lookdev-round-02-candidate-b.json`](./workstation-lookdev-round-02-candidate-b.json)

## User review and Candidate C authorization — 2026-09-18

The user accepted the board as a positional placeholder without selecting a construction type. Review screenshots showed a small unintended gap between the board's right edge and the adjacent backing panel. That named defect authorizes Candidate C.

Candidate C scope:

- Preserve Candidate B's overall board scale as the starting point.
- Close the right-hand gap with the smallest justified local width or horizontal-position correction.
- Keep the board surface generic. Do not choose a frame style, felt colour split, decorative silhouette, mounting method or contents.
- Keep only the scratch card as committed future content; do not add the other reference-image objects.

The three new references represent useful construction families, not a selection: a frameless rounded decorative board, a simple two-tone felt slab, and a framed large-format display board.

## Board editor requirement

The current GLB exposes the board as one mesh, `Pegboard_Perforated_21x14`. A real board editor therefore requires a later geometry split rather than additional controls on the same mesh:

1. `Board assembly`: global width, height, depth and position.
2. `Board frame`: frame width, depth, corner radius, colour and surface response.
3. `Felt insert`: local X/Y/Z position, width, height, thickness, colour and roughness.

Each layer needs its own reset; resizing the frame or insert must keep the assembly position fixed. These controls are for look development and must not imply that a frame or a two-tone treatment has been chosen. Freeform decorations such as the red ribbon silhouette in the first reference require their own curve/mesh and are not achievable through rectangular scale controls alone.

Round 02C will close the seam and specify/scaffold these independent layers. Final board construction and detailed contents remain deferred until the user chooses a board family.

## Candidate C implementation and observation — 2026-09-18

Candidate C uses the following board-assembly correction:

- Width `1.00`, restored from Candidate B's `0.94`.
- Height remains `0.92`.
- Horizontal position `+0.03 m`.
- Depth, vertical position and rotation remain unchanged.

The source geometry measured approximately `0.924 × 0.616 m`. Candidate B produced an approximately `59 mm` right-hand opening. Candidate C reduces the calculated residual seam to approximately `1-2 mm`, allowing a construction joint without reading as an empty slot.

The Lookdev-only preview now replaces the perforated surface with independent `Board assembly`, `Board frame` and `Felt insert` nodes. Frame and insert each support local scale, position, rotation, colour, roughness and their own reset. This runtime preview is intentionally excluded from the normal homepage until a board family is selected and rebuilt in Blender.

Deferred headphones, CV, badge and map objects are hidden in Lookdev mode so the empty board envelope can be judged without decoration. The old pegboard close-up is also disabled in Lookdev mode; the production interaction remains unchanged.

Visual QA passed in Overview, Work and Photography views. The seam is closed, the board remains legible as one intentional plane, and no hidden decoration is required for its silhouette. Independent frame scaling, frame colour and per-layer reset were exercised successfully. Browser console inspection found no application errors.

Classification: **provisional pending user visual approval**.

Reproducible parameters: [`workstation-lookdev-round-02-candidate-c.json`](./workstation-lookdev-round-02-candidate-c.json)
