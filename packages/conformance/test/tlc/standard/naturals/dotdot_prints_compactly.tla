(*---
description: PrintT shows an interval in its .. form, not expanded.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_prints_compactly ----
EXTENDS Naturals, TLC
Test == PrintT(1..5)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..5"
---*)
