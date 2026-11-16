(*---
description: An invariant with a prime is refused at startup.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE primed_invariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x' = x
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
    Note that a bug can cause TLC to incorrectly report this error.
    If you believe your TLA+ or PlusCal specification to be correct,
    please check if this bug described in LevelNode.java starting at line 590ff affects you.
---*)
