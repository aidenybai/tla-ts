(*---
description: 'With an invariant, the same specification fails early with TLC_CONFIG_MISSING_NEXT.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE missing_next_with_invariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init
Inv == x = 0
====

(*--- recorded
all:
  exit: 151
  transcript: 2232:1 The configuration file did not specify the next state predicate.
---*)
