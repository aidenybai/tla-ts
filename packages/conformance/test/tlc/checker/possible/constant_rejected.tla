(*---
description: A _POSSIBLE naming a constant parameter is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANT M = 1
  _POSSIBLE M
---*)
---- MODULE constant_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
CONSTANT M
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The possible M cannot be a constant.
---*)
