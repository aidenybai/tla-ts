(*---
description: "An invariant with a prime is rejected as action-level with the invariant level message."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE prime_in_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
Inv == x' = 1
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
