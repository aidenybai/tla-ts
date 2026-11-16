(*---
description: An interval is finite, even an empty one.
ref: tlc2/value/impl/IntervalValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_interval ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(1..3) /\ IsFiniteSet(3..1)
====

(*--- recorded
all:
  exit: 0
---*)
