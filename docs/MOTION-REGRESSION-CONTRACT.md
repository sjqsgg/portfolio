# Page transition acceptance contract

This is the current behavioral contract. Historical motion-round screenshots and
notes document earlier experiments, not the expected result for new changes.

- Navigation and the page's return control remain visible throughout a route
  transition. They may change their active destination when navigation commits;
  they never participate in the outgoing dark curtain or delayed content reveal.
- A page transition darkens the **entire viewport**, including the bottom edge
  on Home → page, then holds, raises the curved curtain, briefly exposes white,
  and reveals the destination's title, lists, and media as one page group.
- The visual white hold starts when the curve has effectively left the screen
  (85% of its nominal duration). The development controller sets the darken,
  hold, curve, white hold, reveal duration, and starting offset.
- Ordinary Home loading does not show the old workstation poster; its colour
  and scale differ from the 3D model. Reduced-motion and save-data users still
  receive the static fallback instead of WebGL.
- A second navigation during an active transition cannot start another dark
  snapshot. History, photo expansion/return, reduced motion, and browsers
  without View Transitions must still land on a visible, operable page.

The current confirmed baseline is darken 340ms, dark hold 80ms, curve 890ms,
white hold 0ms, page reveal 760ms, start offset 60px. The visual curve exit
is at 1177ms (340 + 80 + round(0.85 × 890)).

Before publishing a motion change, run build, lint, data tests, and browser
tests. The browser matrix must include Home ↔ Projects/Photography/About/Contact
on desktop and mobile, bottom-edge pixel samples during the dark hold, content
and navigation snapshot timing, return-to-Home no-poster loading, quick
history, reduced motion, gallery return position, and the controller's zero
white-hold limit. Pixel checks are a guard, not proof on every GPU/browser:
also inspect a real Chrome desktop/mobile capture before claiming a device-only
visual artifact is gone. Record unverified environments explicitly.

TypeSafe/Jev can help classify exploratory browser findings or route states;
geometry, colour, frame timing and WebGL pixels must use deterministic browser
and screenshot assertions rather than semantic confidence scores.
