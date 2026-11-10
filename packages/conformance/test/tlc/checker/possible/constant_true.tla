(*---
description: A constant TRUE _POSSIBLE predicate is rejected as a constant.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE constant_true ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The possible Pred cannot be a constant.
---*)
