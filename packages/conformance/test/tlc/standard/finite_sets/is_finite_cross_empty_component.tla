(*---
description: One empty component empties the product, so it is finite though another is Nat.
ref: tlc2/value/impl/SetOfTuplesValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_cross_empty_component ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({} \X Nat) /\ IsFiniteSet(Nat \X {})
====

(*--- recorded
all:
  exit: 0
---*)
