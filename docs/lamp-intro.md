# Workstation lamp opening

The first live Home visit starts with a near-black cool-gray stage and unlit workstation. Once the
existing loading curtain has finished, a 5.15-second opening turns the lamp
head toward the monitor, sweeps toward the cameras, returns the head to rest,
and restores the normal scene lighting. Brief Projects / Photography labels
identify the illuminated areas. Mobile overview uses a wider 49-degree field
of view so both destinations are visible.

`src/portfolio/lampIntro.js` owns the lamp joint, spotlight, faint light shaft
and timing. It runs in Workbench's existing render loop, uses elapsed visible
time, pauses in background tabs and releases its resources on unmount. The
shade and diffuser rotate together; the stand stays fixed. Normal lighting
and the original head pose are restored on completion or interruption.

During the opening, ambient, key, fill, environment and existing emissive light
are suppressed. A broad neutral-white spotlight with a trace of warmth supplies the illuminated surfaces and
shadows, with a stronger visible shaft. A short-range bounce near the monitor
reveals its front, since the physical desk lamp stands behind it. All original
emissive intensities are restored with the final reveal and on interruption.
The shaft and diffuser use matching neutral colors instead of amber. Daylight
fades in over the last 0.85 seconds, overlapping the fading spotlight; the cool
background passes through gray to the original white canvas without a lighting gap.

Only the return-to-rest transition receives a gentle color grade. Each surface
retains at least 70% of its original chroma; wood stays wood-colored and green
stays green throughout. Correction strength follows a smooth bell curve driven
by the daylight level, rather than a grayscale phase followed by coloring.
Diffuse light rises slightly ahead of the key to lift muddy half-lit surfaces.
Completion, skipping and disposal restore every captured color. The normal
workstation palette in `workstation-current.json` is unchanged.
The shaft retains its truncated cone with a finite opening at the lamp mouth;
the shadow-casting spotlight remains the same.

Touching, dragging, wheeling or using navigation keys ends the opening.
Returning Home within the same loaded app does not repeat it, including when
the visitor navigates away before it finishes. Reduced-motion/data-saving
preferences and failed WebGL keep the lit static fallback.

Preview: `/?lampintro=1` forces the welcome on entry and adds a Replay opening
button. The normal URL has no replay control. In development, `?lampintro=0`
skips the opening so the poster generator captures the final lit scene.

Validation: `npm run build`, `npm test`, and the five browser tests in
`tests/lamp-intro.spec.js`. The existing loader handoff, reduced-motion,
data-saving and no-View-Transitions tests were also checked. Desktop and
390 × 844 touch viewport captures are in `docs/qa/lamp-intro/`. These are browser
viewport checks, not a physical-phone certification.
