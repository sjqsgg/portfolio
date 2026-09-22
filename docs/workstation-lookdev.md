# Workstation look-development controls

Run `npm run lookdev`. The controls only load in the Vite development build and do not appear on the published portfolio. Both the published page and Lookdev start from [`workstation-current.json`](./workstation-current.json); archived round files are references only and are never applied automatically.

## Review order

1. **Structure:** compare one part at a time. Keep position fixed is enabled by default, so width, height, length and rotation preserve the part's visual centre. Main frame and Rear frame also expose Tube thickness. Check silhouette, usable desk depth, tabletop and frame weight, storage-to-desk ratio, chair scale, and negative space. Non-uniform scaling is only a visual trial; approved dimensions must be rebuilt in the Blender source so tubes, joints and bevels remain correct.
2. **Board:** adjust the felt insert and frame colours, border weight, lower rail, depth, shallow groove and corner profile. The source perforated mesh is used only as a placement envelope and is removed before rendering.
3. **Surface:** select a material to compare colour, roughness, metalness, clearcoat and opacity. A material edit affects every mesh using that material, which is useful for checking palette coherence.
4. **Light:** judge materials under Neutral first. Use Soft product to inspect form and Warm / cool to test the intended portfolio mood. Do not use lighting to hide a weak material.

Each tab has a reset button directly below its selector. A selected part resets all of its scale, position and rotation values; Surface resets every property of the selected material; Light resets all lighting values. The whole model is only reset when Whole workstation is selected.

Import draft applies a user-exported draft to the current production baseline. Save draft stores the current setup in this browser under a stable key. Earlier `v1` and `v2` values are kept for recovery but are not applied automatically. Copy produces the hand-off record used to update `workstation-current.json` after approval.

## Archived checkpoints

- [Checkpoint 01 - Lighter, less crowded](./workstation-lookdev-round-01.md)
