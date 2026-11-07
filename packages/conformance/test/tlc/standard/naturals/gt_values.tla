(*---
description: "> compares integers."
ref: tlc2/module/Naturals.java#GT
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE gt_values ----
EXTENDS Naturals
Test == 2 > 1 /\ ~(2 > 2) /\ ~(1 > 2)
====

(*--- recorded
all:
  exit: 0
---*)
