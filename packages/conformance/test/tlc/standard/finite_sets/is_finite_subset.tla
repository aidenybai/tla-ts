(*---
description: SUBSET is finite exactly when its base is.
ref: tlc2/value/impl/SubsetValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_subset ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(SUBSET {1}) /\ ~IsFiniteSet(SUBSET Nat)
====

(*--- recorded
all:
  exit: 0
---*)
