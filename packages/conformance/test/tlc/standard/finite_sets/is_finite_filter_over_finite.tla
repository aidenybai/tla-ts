(*---
description: A filter over a finite set is finite.
ref: tlc2/value/impl/SetPredValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_filter_over_finite ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({n \in 1..3 : n > 1})
====

(*--- recorded
all:
  exit: 0
---*)
