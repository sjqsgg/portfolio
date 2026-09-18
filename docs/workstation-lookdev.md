# Workstation look-development controls

Run `npm run lookdev`. The controls only load in the Vite development build and do not appear on the published portfolio.

## Review order

1. **Structure:** compare one part at a time. Keep position fixed is enabled by default, so width, height, length and rotation preserve the part's visual centre. Main frame and Rear frame also expose Tube thickness. Check silhouette, usable desk depth, tabletop and frame weight, storage-to-desk ratio, chair scale, and negative space. Non-uniform scaling is only a visual trial; approved dimensions must be rebuilt in the Blender source so tubes, joints and bevels remain correct.
2. **Surface:** choose a material name, then test colour, roughness, metalness and clearcoat. A material edit affects every mesh using that material, which is useful for checking palette coherence.
3. **Light:** judge materials under Neutral first. Use Soft product to inspect form and Warm / cool to test the intended portfolio mood. Do not use lighting to hide a weak material.

Each tab has a reset button directly below its selector. A selected part resets all of its scale, position and rotation values; Surface resets every property of the selected material; Light resets all lighting values. The whole model is only reset when Whole workstation is selected.

Load JSON applies a recorded checkpoint to the current model without saving it. Save stores the current setup in this browser. Copy produces the hand-off record for updating `scripts/build-workstation-v003.py`.

## Recorded checkpoints

- [Checkpoint 01 — Lighter, less crowded](./workstation-lookdev-round-01.md)
