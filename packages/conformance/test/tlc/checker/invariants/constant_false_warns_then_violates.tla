(*---
description: "An invariant with the constant value FALSE is rejected as a configuration error before checking."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE constant_false_warns_then_violates ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The invariant of Inv is equal to FALSE
---*)
