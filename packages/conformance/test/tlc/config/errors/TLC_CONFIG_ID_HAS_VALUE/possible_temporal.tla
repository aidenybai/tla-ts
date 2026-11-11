(*---
description: _POSSIBLE takes state and action predicates only, so a temporal formula is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE T
---*)
---- MODULE possible_temporal ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
T == <>(x = 1)
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The possible of T is equal to a temporal formula; only state- and action-level predicates are supported
---*)
