(*---
description: Enumerated sets are finite, including the empty set.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_set_enum ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({}) /\ IsFiniteSet({1, 2})
====

(*--- recorded
all:
  exit: 0
---*)
