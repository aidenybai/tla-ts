(*---
description: UNION with an infinite element is not finite.
ref: tlc2/value/impl/UnionValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_union_of_infinite ----
EXTENDS FiniteSets, Naturals
Test == ~IsFiniteSet(UNION {Nat})
====

(*--- recorded
all:
  exit: 0
---*)
