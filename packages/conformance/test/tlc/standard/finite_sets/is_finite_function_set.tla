(*---
description: A function set with finite domain and range is finite.
ref: tlc2/value/impl/SetOfFcnsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_function_set ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([{1} -> {2}])
====

(*--- recorded
all:
  exit: 0
---*)
