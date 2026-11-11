(*---
description: 'An INVARIANT with a prime passes SANY: TLC rejects it with TLC_INVARIANT_VIOLATED_LEVEL, exit 76.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE tlc_invariant_primed ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Inv == x' = 1
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
