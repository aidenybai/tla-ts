(*---
description: An infinite domain with a one-element range gives one function, so the set is finite.
ref: tlc2/value/impl/SetOfFcnsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_function_set_infinite_domain_singleton_range ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([Nat -> {1}])
====

(*--- recorded
all:
  exit: 0
---*)
