(*---
description: b < a gives the empty set.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_empty ----
EXTENDS Naturals
Test == 3..1 = {} /\ {} = 3..1
====

(*--- recorded
all:
  exit: 0
---*)
