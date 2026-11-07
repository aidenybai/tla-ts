(*---
description: 'An INVARIANT with an inner box is rejected the same way.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE tlc_invariant_box ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Inv == [](x < 5)
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
