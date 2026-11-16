(*---
description: a..b has exactly the integers between a and b.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_elements ----
EXTENDS Naturals
Test == 1..3 = {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
