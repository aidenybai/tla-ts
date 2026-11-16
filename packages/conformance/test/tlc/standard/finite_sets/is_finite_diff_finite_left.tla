(*---
description: S \ T is finite when S is, whatever T.
ref: tlc2/value/impl/SetDiffValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_diff_finite_left ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({1} \ Nat)
====

(*--- recorded
all:
  exit: 0
---*)
