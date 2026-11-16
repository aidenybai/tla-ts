(*---
description: "[{} -> Nat] has one element, so it is finite though Nat is not."
ref: tlc2/value/impl/SetOfFcnsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_function_set_empty_domain ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([{} -> Nat])
====

(*--- recorded
all:
  exit: 0
---*)
