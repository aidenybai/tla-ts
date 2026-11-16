(*---
description: The level check runs on the invariant after substitution, so a primed argument to a constant operator is refused at startup.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT C <- G
---*)
---- MODULE primed_invariant_hidden_by_constant_operator ----
EXTENDS Naturals
CONSTANT C(_)
VARIABLE x
G(a) == a
Init == x = 0
Next == x' = x
Inv == C(x')
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
