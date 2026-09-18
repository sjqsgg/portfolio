# Workstation lookdev - round 02 decision

Accepted: 2026-09-18  
Published as the production board baseline: 2026-09-18

Checkpoint: [`workstation-lookdev-round-02.json`](./workstation-lookdev-round-02.json)

## Decision

Round 02 is accepted from the user's exported JSON. The board remains a generic felt-board placeholder, but its envelope, frame preview and felt-insert preview now have reproducible independent transforms.

## Accepted values

- Board assembly: width `1.00`, height `0.92`, horizontal position `+0.03 m`.
- Board frame preview: width `1.08`, height `1.15`.
- Felt insert preview: height `1.05`, horizontal position `-0.02 m`, vertical position `-0.005 m`.
- Round 01 rear frame, audio and speaker envelope values remain unchanged.
- The exact material and neutral-light values are preserved in the checkpoint JSON.

## Candidate classification

- Candidate B upper-storage reduction: **rejected/reset**. It is absent from the user's final export and therefore does not enter the checkpoint.
- Candidate C board seam correction: **accepted**.
- Board frame and felt-layer transforms from the user's final export: **accepted as Lookdev parameters**.
- Board construction family, corner treatment and final felt colours: **deferred**.
- Board contents other than a future scratch card: **deferred**.

## Evidence and implementation boundary

Overview, Work and Photography fixed views were checked with the board/right-backing seam closed. The browser editor exposes `Board assembly`, `Board frame` and `Felt insert` as separate selections with per-layer reset and surface controls.

The accepted layered placeholder is now also the normal homepage baseline: the perforated board is replaced at runtime by the independently sized frame and felt insert, and the accepted seam correction closes the gap against the right backing panel. This remains a deliberately generic placeholder until a board construction family is selected and rebuilt in Blender. Deferred board objects stay hidden; the future scratch card has not yet been modeled.

## Next round

Round 03 changes only the left and right speaker geometry. The central audio module, its placement and its existing shape are frozen.
