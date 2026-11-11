(*---
description: An invariant with a prime is rejected with the level message before model checking.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE action_level_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x' > 0
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
