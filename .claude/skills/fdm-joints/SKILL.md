---
name: fdm-joints
description: Design a joint between two 3D-printed parts (FDM, 0.4 mm nozzle) that goes together by hand - a peg in a hole that stays put, turns, or comes off - with the play, sizes and checks that work on a real printer. Use when a figure, toy or asset is printed in pieces (lib/cast.js, lib/print.js export, Bloc-Art handles and tabs), when Simon says a connector is too complex or clips, or before drawing any pin, socket, slot or snap.
---

# Joints for FDM prints

Simon's rule (r330, 23 Oct): « A single male female slot would work WAY better here ». A joint is ONE straight
peg (male) in ONE straight hole (female). No bulbs, no hubs, no snaps, no dovetails, unless he asks: at
figure size (a 60 mm person) every extra feature is under two nozzle widths and prints as mush.

## The numbers (PLA or PETG, 0.4 mm nozzle, 0.2 mm layers)

| what | value | where it comes from |
|---|---|---|
| play a side, part stays put, comes off by hand (`press`) | 0.10 mm (0.08-0.15) | Bloc-Art tolerance_fix_summary.txt: default 0.10 a side; cup_handle_attachment.py: 0.12 for a peg that is glued |
| play a side, part turns and holds a pose (`turn`) | 0.20 mm (0.15-0.30) | FDM practice: 0.2 turns with friction, 0.3 spins loose and falls out of a sideways hole |
| hole depth past the peg's end | +0.5 mm | Bloc-Art: cut_overshoot 0.5 mm; the hole's floor sags and the peg's tip has elephant's foot |
| narrowest peg | 2.5 mm across (3 mm better) | under 2.5 a peg snaps at the layer lines when pressed in; Bloc-Art's pegs are 5 mm |
| gap between a turning part and its neighbour | 0.3-0.4 mm | r395's probe (0.3), r330 (0.4): less and the two faces print fused |
| thinnest wall round a hole | 1 mm | lib/print.js THIN: two nozzle lines |

The play is per SIDE: a 3 mm peg with 0.1 mm play wants a 3.2 mm hole.

## Shape rules

- Print a peg STANDING (its axis vertical) when you can: round in X-Y, strong. A peg lying down is an oval with a weak
  seam; give it 0.05 mm more play.
- Chamfer or round the peg's tip (about 0.3 mm): the first layer spreads (elephant's foot) and will not enter.
- A hole whose axis is horizontal prints with a drooping roof: keep it under 5 mm or make its top a point (teardrop).
- Small holes print undersized. That is what the play is for, so do not add more on top of the table's numbers.
- A part that turns needs its peg AND its gap: the hole holds it, the gap lets it move (Simon, r330, 12:53).
- Both sides of a joint belong to two different printed pieces. The peg is part of one, the hole is cut from the other.

## In this repo

- lib/cast.js: every joint is pushed to `userData.joints` ({ name, male, female, r, bore | none, deep, kind, gap }),
  in the figure's units. A peg mesh has `userData.pin`; the hole it goes into is cut by lib/fit.js (and, after
  r501, by the export), never modelled, unless the female draws it (a ring's bore, the fist's hole: `bore`).
- lib/fit.js holds the table (`JOINT`, `PEG_MIN`, `DEPTH`, `GAP_MIN`) and checks every joint against it, plus the
  voxel checks (clips, slides, loose islands, thin walls, swings). The play is finer than the 0.2 mm voxels, so it
  is checked from the numbers, not from the voxels.
- Check: node tests/cast_fit.mjs (all ok); lab/cast/fit.html draws what it finds.
- The table is for 60 mm figures and a 0.4 mm nozzle. The play is absolute (mm), so a figure printed at another
  size keeps the same play: scale the geometry, never the play.

## Elsewhere

Bloc-Art (~/Documents/GitHub/Bloc-Art) cuts the same kind of joints with trimesh booleans: `_create_peg` and
`attach_handle_pegs` in cup_handle_attachment.py (peg r 2.5, hole +0.12), the tab and slot of grid_split.py
(tolerance a side, 0.5 mm overshoot at both ends). When a number here changes after a real print, change it in both
places, and say which printer and filament it was.
