(*---
description: A _POSSIBLE naming an operator with arguments is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE with_args_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred(a) == a
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires possible not to take any argument, but one was given: Pred"
---*)
