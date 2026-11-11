(*---
description: A nonempty domain and an infinite range give an infinite set.
ref: tlc2/value/impl/SetOfFcnsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_function_set_infinite_range ----
EXTENDS FiniteSets, Naturals
Test == ~IsFiniteSet([{1} -> Nat])
====

(*--- recorded
all:
  exit: 0
---*)
