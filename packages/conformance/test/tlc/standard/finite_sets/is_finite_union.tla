(*---
description: UNION is finite when every element is.
ref: tlc2/value/impl/UnionValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_union ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(UNION {{1}, {2}})
====

(*--- recorded
all:
  exit: 0
---*)
