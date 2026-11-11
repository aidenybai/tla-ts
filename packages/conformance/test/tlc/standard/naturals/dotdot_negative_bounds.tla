(*---
description: An interval spans negative bounds.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_negative_bounds ----
EXTENDS Naturals
Test == (0 - 1)..1 = {0 - 1, 0, 1}
====

(*--- recorded
all:
  exit: 0
---*)
