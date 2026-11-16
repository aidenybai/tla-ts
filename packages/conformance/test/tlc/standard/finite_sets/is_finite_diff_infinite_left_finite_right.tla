(*---
description: Infinite minus finite is infinite.
ref: tlc2/value/impl/SetDiffValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_diff_infinite_left_finite_right ----
EXTENDS FiniteSets, Naturals
Test == ~IsFiniteSet(Nat \ {1})
====

(*--- recorded
all:
  exit: 0
---*)
