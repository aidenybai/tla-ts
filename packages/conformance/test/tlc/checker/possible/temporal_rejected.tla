(*---
description: A temporal predicate is rejected with the has-value message.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE temporal_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred == <>(x = 1)
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The possible of Pred is equal to a temporal formula; only state- and action-level predicates are supported
---*)
