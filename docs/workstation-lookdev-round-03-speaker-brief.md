# Workstation lookdev — round 03 speaker geometry brief

Prepared: 2026-09-18

Status: Candidate B geometry accepted; surface detail deferred

Baseline: the accepted Round 02 checkpoint; checkpoint 01 speaker mass and spacing remain the starting envelope.

## Primary question

Can the left and right speakers inherit the user's real Philips speaker geometry while remaining simplified, fashionable and consistent with the workstation's stylised commercial-3D language?

## Reference files

- [`speaker-front.jpg`](./references/2026-09-18-speaker/speaker-front.jpg) — front and elevated view of one speaker.
- [`speaker-system.jpg`](./references/2026-09-18-speaker/speaker-system.jpg) - a clearer frontal view of the speaker cabinet and driver spacing. The adjacent central unit is not in scope.

The photographs are geometry and hierarchy references. Brand marks, exact labels, every control and incidental surrounding objects are not modeling requirements.

## Reference features to preserve

- A tall, pale cabinet whose broad main front face does not turn directly into the side walls.
- Two narrow transition faces sit slightly behind or inward from the main front plane, one on each side. These shallow cut planes bridge the front face into the cabinet sides and must remain readable in light and silhouette.
- One dominant lower woofer occupying roughly half the cabinet width.
- A black compliant surround, pale metallic cone and restrained bright outer ring around the woofer.
- A vertically rounded, capsule-like upper plate holding two much smaller drivers.
- Four visible corner fasteners as optional low-cost detail, subject to the final stylisation level.
- A clear three-level size hierarchy: large woofer, medium upper driver, small tweeter.

## Simplification rules

- Preserve silhouette and driver hierarchy before small detail.
- Use broad bevels and clean satin surfaces; do not reproduce every screw, label, slot or reflection.
- Keep chrome as an accent around drivers, not as a mirror-like material covering the whole assembly.
- Omit the `PHILIPS` wordmark and reference-specific text.
- Do not copy the lens, books, cards, straps or shelving visible in the photographs.

## Allowed variables

- Speaker cabinet silhouette, bevel/chamfer size and depth.
- Width, angle and inset depth of the two front-to-side transition faces.
- Woofer, mid-driver and tweeter diameters, depth and spacing.
- Upper capsule plate proportions.
- Small corrections inside the accepted left/right speaker bounding envelopes when required to prevent clipping.

## Frozen variables

- Round 02 workstation, storage, chair and board-envelope geometry.
- The central audio module in full: geometry, scale, materials, placement and controls.
- Left/right speaker placement and accepted bounding mass unless the new speaker geometry demonstrably clips its cabinet opening.
- Final colour palette, detailed material response and lighting; these belong to later rounds.
- Brand graphics and decorative props.

## Candidate strategy

- **A — Current model:** accepted Round 02 checkpoint unchanged.
- **B — Reference-faithful hierarchy:** three driver sizes, capsule plate, pale cabinet and explicit paired transition faces before the sides.
- **C — Stylised reduction:** preserve the large woofer and capsule silhouette while simplifying fasteners, rings and front-panel controls.

Candidate C is not automatically preferable: the comparison must determine how much detail remains readable in Overview and Photography views.

## Acceptance criteria

1. Both speakers read immediately as speakers in Overview without depending on colour contrast.
2. The lower woofer is the dominant form; upper drivers do not compete at equal scale.
3. The cabinets remain inside the accepted lower storage openings without visual crowding or collision.
4. Driver rings use a restrained thickness and do not produce a jewellery-like or generic AI-render appearance.
5. The two shallow side-transition faces are visible as intentional planes rather than a generic bevel or rounded corner.
6. The central audio module is pixel-for-pixel unchanged from the accepted Round 02 baseline.
7. The result is recognisably inspired by the supplied system without becoming a literal branded product replica.
8. Overview, Work and Photography interaction framing remains usable.

## Required outputs

- A/B and, if justified, C fixed-view comparisons.
- Parametric Blender geometry rather than permanent browser-only non-uniform scaling.
- A Round 03 checkpoint JSON and decision record.
- Model, checkpoint, lint, unit, build and browser visual gates from the workstation Harness.

## Candidate B implementation — 2026-09-18

Candidate B is now generated in the Blender source derivative and exported GLB. Only descendants of `Speaker_Left` and `Speaker_Right` were replaced; their parent transforms and the accepted Round 02 runtime scales remain unchanged. `AUDIO_ZONE` and the central audio module were not edited.

### Parametric geometry

| Feature | Candidate B value |
| --- | ---: |
| Original per-speaker envelope | 398 × 636 × 413 mm |
| Candidate B per-speaker envelope | 398 × 636 × 413 mm |
| Broad front-plane width | 328 mm |
| Cabinet transition | paired 35 mm diagonal runs from front plane into side walls |
| Upper capsule | 154 × 226 mm |
| Woofer outer diameter | 274 mm |
| Mid-driver outer diameter | 126 mm |
| Tweeter outer diameter | 64 mm |
| Fasteners | four restrained 12 mm caps |

The front cross-section is an explicit six-sided prism, not a generic rounded box: the main face ends at ±164 mm, then the left and right transition faces turn back 27 mm before the long side walls begin. This makes the two cut faces real geometry that can catch light independently.

### Automated evidence

- GLB structural validator: pass.
- Accepted Round 02 checkpoint validator: pass; 7 parts, 12 materials and lighting retained.
- Unit tests: 2/2 pass.
- Production build: pass.
- Browser regression suite: 24 passed, 1 intentionally skipped.
- Lint: 0 errors; the pre-existing `CVLightbox.jsx` Fast Refresh warning remains.
- Exported speaker envelope comparison: exact match on both speakers.

### First fixed-view review

- Overview: pass for immediate speaker recognition and a dominant woofer.
- Upper hierarchy: pass; the vertical capsule clearly groups the small tweeter and medium driver without resembling the central audio unit.
- Storage fit and negative space: pass; the accepted cabinet occupancy is unchanged.
- Central audio freeze: pass by scoped source edit; no central-audio geometry path is touched.
- Transition-face readability: provisional. The facets are present and visible as narrow side reveals in the current oblique Overview, but should be judged by the user before Candidate B becomes the Round 03 baseline.
- Chrome restraint and final colours: provisional by design; material tuning remains frozen for this geometry round.

## Decision — 2026-09-18

Candidate B's speaker silhouette, paired transition faces and three-driver proportions are **accepted**. This closes the Round 03 shape decision without treating the current surfaces as final.

Deferred speaker work is split by cause rather than bundled back into this round:

- **Round 05 — shared geometry language:** add the broad grille relief that follows the speaker forms, including the shallow concave/convex transitions around the driver areas. This pass may change local depth but must preserve the accepted outer silhouette and driver layout.
- **Round 06 — material identity:** build the perforated or woven grille response: fine holes/cloth structure, normal or bump scale, roughness and restrained shadowing. These details should read at close range without turning into noisy geometry in Overview.
- **Round 08 — final palette:** settle the final grille, cabinet and driver colours only after lighting is stable.

The central audio module remains frozen. Round 04 may now begin independently with the computer-tower conversion.
