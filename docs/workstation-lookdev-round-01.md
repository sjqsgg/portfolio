# Workstation lookdev — checkpoint 01

Recorded: 2026-09-17

Working title: **Lighter, less crowded**

Status: exploratory checkpoint; structural direction accepted, palette provisional.

## What changed

### Composition and proportions

| Part | Width X | Height Y | Length Z | Tube thickness | Position / rotation |
| --- | ---: | ---: | ---: | ---: | --- |
| Rear frame | 1.00 | 0.70 | 0.70 | 1.42 | Unchanged; centre locked |
| Audio module / turntable stack | 0.86 | 0.96 | 0.87 | — | Unchanged; centre locked |
| Left speaker | 0.84 | 0.87 | 1.07 | — | Unchanged; centre locked |
| Right speaker | 0.84 | 0.87 | 1.07 | — | Unchanged; centre locked |

The audio equipment is narrower and slightly shallower, while both speakers are narrower and shorter with a small depth increase. This reduces the lower cabinet's visual density and creates clearer separation between the speakers, audio stack and cabinet frame.

The rear frame is compressed vertically and in depth, with a thicker tube profile used to retain graphic weight. This combination is a visual test rather than a construction-ready dimension.

## Material snapshot

| Material | Colour | Roughness | Metalness | Clearcoat |
| --- | --- | ---: | ---: | ---: |
| Screen | `#ffffff` | 0.32 | 0.00 | 0.00 |
| Ink | `#82c0a9` | 0.90 | 0.00 | 0.00 |
| Petrol powder coat | `#adff5c` | 0.46 | 0.00 | 0.00 |
| Speaker walnut | `#ae9b6f` | 0.53 | 0.00 | 0.00 |
| Speaker cloth | `#b0c7a3` | 0.96 | 0.00 | 0.00 |
| Sage board | `#8fe85e` | 0.56 | 0.00 | 0.00 |
| Rubber | `#bfc478` | 0.64 | 0.00 | 0.00 |
| Pale ash | `#d8cfbb` | 0.57 | 0.00 | 0.57 |
| Green enamel | `#fbed5b` | 0.23 | 0.00 | 0.35 |
| Camera metal | `#949494` | 0.34 | 0.70 | 0.00 |

Lighting remains at the original neutral baseline: exposure 0.98, ambient 0.85, key 3.00, fill 0.65 and practical 0.00. That makes this checkpoint useful for comparing geometry and palette without a lighting change masking the result.

## Visual assessment

### Confirmed direction

- Reducing the audio stack and speaker footprint makes the lower half calmer and gives the cabinet structure more breathing room.
- Replacing the dark green field with pale yellow-green and cream tones moves the workstation closer to the desired light, stylised commercial-render character.
- The warmer ash and speaker colours integrate the audio equipment with the furniture instead of making it read as a separate dark block.
- Keeping the lighting unchanged confirms that the improvement comes from massing and palette, not from brighter illumination.

### Still provisional

- The two bright greens (`#adff5c` and `#8fe85e`) cover several large surfaces. Their final saturation should be decided only after material and lighting passes.
- Pale ash clearcoat at 0.57 may make the wood read as coated plastic. Compare it against a lower-clearcoat version during the material pass.
- Speaker cloth roughness at 0.96 is a promising fabric direction, but it needs enough bump or weave response to avoid looking flat.
- White Screen at roughness 0.32 may become visually washed out under the final lighting setup.
- The compressed rear frame must be rebuilt parametrically before approval so tube intersections and cabinet support logic remain credible.

## Next review sequence

1. Complete the large-form proportion pass for desktop, storage, chair and board without further palette polishing.
2. Rebuild approved audio and rear-frame dimensions in Blender rather than preserving runtime non-uniform scale.
3. Run the bevel and material-response pass under the unchanged neutral lighting.
4. Tune lighting after material families are coherent.
5. Return to final palette balancing, retaining one or two darker anchors so the pale green scheme does not become uniformly washed out.

Exact reproducible values are stored in [`workstation-lookdev-round-01.json`](./workstation-lookdev-round-01.json).
