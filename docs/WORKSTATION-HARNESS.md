# Workstation round harness

Status: active from round 02

Baseline: [checkpoint 01](./workstation-lookdev-round-01.md)

The harness turns each visual iteration into a bounded, reproducible review. It prevents proportion, material, lighting and palette changes from being mixed together without evidence.

## Required round inputs

Every round starts with a short brief containing:

1. **Question:** one primary visual question the round must answer.
2. **Allowed variables:** the parts and parameter families that may change.
3. **Frozen variables:** everything that must remain unchanged.
4. **References:** only the images or earlier checkpoints relevant to this question.
5. **Acceptance criteria:** observable pass/fail conditions written before editing.
6. **Baseline:** the exact checkpoint JSON loaded at the start.

If a new problem is discovered outside the allowed variables, record it for a later round instead of silently expanding scope.

## Roles

The primary agent owns scope, integration and the final decision record. Independent agents may be used only for bounded reviews with distinct outputs, for example:

- **Geometry reviewer:** silhouette, real-world scale, clearances and negative space.
- **Material reviewer:** material identity, roughness hierarchy and unwanted plastic appearance.
- **Visual QA reviewer:** fixed-view comparison, responsive framing and regressions.

Agents do not edit the same parameter family concurrently. Conflicting advice is reported to the primary agent rather than averaged together.

## Round sequence

### 1. Preflight

- Working tree and baseline commit are recorded.
- Baseline checkpoint passes `npm run lookdev:validate`.
- The live model loads with no console error.
- The round brief is complete before parameters change.

### 2. Baseline capture

- Capture Overview, Work and Photography views at the agreed desktop viewport.
- Capture the relevant close view when the round concerns one zone.
- Use neutral lighting unless lighting itself is the round subject.

### 3. Controlled adjustment

- Load the baseline JSON.
- Change only allowed variables.
- Use `Keep position fixed` for dimension comparisons unless movement is explicitly in scope.
- Treat non-uniform runtime scaling and tube thickness as visual trials; approved geometry is rebuilt parametrically in Blender.
- Save named candidates rather than continuously overwriting the only state.

### 4. Automated gates

Run:

```sh
npm run lookdev:validate -- docs/<checkpoint>.json
npm run lint
npm test
npm run build
node scripts/validate-workstation.mjs
```

Before a release or merge, also run the existing browser suite with an installed browser:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

An unavailable browser is recorded as an infrastructure blocker, never reported as a passing test.

### 5. Visual review

Compare against the baseline using the same camera and lighting. Review only the round's acceptance criteria first, then note side effects separately. A visually improved candidate can still fail if it breaks physical credibility, interaction targets or responsive framing.

### 6. Decision gate

Every changed parameter is classified as:

- **Accepted:** ready to become the next baseline.
- **Provisional:** useful direction, but must be revisited after a named later pass.
- **Rejected:** retained only in notes, not in the next baseline.

No round is complete while a changed value has no classification.

### 7. Checkpoint output

Create, without overwriting earlier rounds:

- `docs/workstation-lookdev-round-NN.json` — exact reproducible state.
- `docs/workstation-lookdev-round-NN.md` — brief, values, evidence, decision and next questions.
- Fixed-view screenshots when they materially support the decision.
- A commit containing the checkpoint and any accepted implementation changes.

## Planned round order

1. **Round 02 — remaining large-form proportions:** desktop, storage, chair, board and negative space. Freeze checkpoint 01 lighting; palette remains provisional.
2. **Round 03 — geometry language:** tabletop/frame thickness, bevels, edge softness and tube construction. Rebuild accepted non-uniform trials in Blender.
3. **Round 04 — material identity:** wood, metal, cloth, enamel, felt and screen response under neutral light.
4. **Round 05 — lighting:** exposure, key/fill balance, practical lamp and shadow softness with materials frozen.
5. **Round 06 — final palette:** balance pale yellow-green, cream, metal and the darker anchors; integrate Isabelle's yellow/white/pink without making her visually abrupt.

Object-specific modeling that has not been discussed is not pulled into these rounds automatically. It receives its own brief when activated.

## Global constraints

- The model is the workstation, not a surrounding room.
- The board direction is felt, not a perforated pegboard; only the scratch card is committed content for the first detailed board pass.
- Other board objects remain deferred.
- Isabelle keeps her original compact Animal Crossing proportions. She begins low in the chair, potentially showing only a small part of her head or ears.
- The target rendering language is stylised commercial 3D: simplified large forms, broad controlled bevels, satin materials, restrained chrome and deliberate warm/cool light—not photorealism and not generic AI-room imagery.
