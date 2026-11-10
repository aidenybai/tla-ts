(*---
description: 'An INVARIANT whose RECURSIVE definition is temporal fails the level check, exit 76.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE tlc_invariant_recursive_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
RECURSIVE R(_)
R(n) == IF n = 0 THEN <>(x = 1) ELSE R(n - 1)
Inv == R(0)
====

(*--- recorded
all:
  exit: 76
  transcript: 2146:1 The invariant Inv is not a state predicate (one with no primes or temporal operators).
---*)
