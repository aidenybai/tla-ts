(*---
description: An intersection is finite if either side is.
ref: tlc2/value/impl/SetCapValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_cap_one_side_finite ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(Nat \cap {1}) /\ IsFiniteSet({1} \cap Nat)
====

(*--- recorded
all:
  exit: 0
---*)
