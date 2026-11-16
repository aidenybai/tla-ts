(*---
description: A function over a finite domain arrives as an enumerated FcnRcdValue, whose isFinite answers TRUE.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_of_enumerated_function ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet([x \in {1} |-> x])
====

(*--- recorded
all:
  exit: 0
---*)
