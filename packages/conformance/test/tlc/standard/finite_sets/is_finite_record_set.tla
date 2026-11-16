(*---
description: A record set is finite if all its field sets are.
ref: tlc2/value/impl/SetOfRcdsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_record_set ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([a : {1}]) /\ ~IsFiniteSet([a : Nat])
====

(*--- recorded
all:
  exit: 0
---*)
