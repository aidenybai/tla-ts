(*---
description: A product is finite if all its components are.
ref: tlc2/value/impl/SetOfTuplesValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_cross ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({1} \X {2}) /\ ~IsFiniteSet(Nat \X {1})
====

(*--- recorded
all:
  exit: 0
---*)
