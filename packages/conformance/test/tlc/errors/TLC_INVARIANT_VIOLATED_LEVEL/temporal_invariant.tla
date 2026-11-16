(*---
description: An invariant with a temporal operator is refused at startup.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE temporal_invariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x
Inv == [](x = 0)
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
