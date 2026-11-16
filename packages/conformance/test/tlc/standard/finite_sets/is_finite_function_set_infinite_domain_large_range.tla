(*---
description: An infinite domain with two or more range values is infinite.
ref: tlc2/value/impl/SetOfFcnsValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_function_set_infinite_domain_large_range ----
EXTENDS FiniteSets, Naturals
Test == ~IsFiniteSet([Nat -> {1, 2}])
====

(*--- recorded
all:
  exit: 0
---*)
