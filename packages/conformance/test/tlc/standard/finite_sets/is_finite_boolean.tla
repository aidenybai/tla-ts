(*---
description: BOOLEAN is finite.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_boolean ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(BOOLEAN)
====

(*--- recorded
all:
  exit: 0
---*)
