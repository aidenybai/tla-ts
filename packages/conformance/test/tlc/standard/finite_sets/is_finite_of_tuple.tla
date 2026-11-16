(*---
description: "IsFiniteSet accepts a tuple: TupleValue.isFinite returns TRUE without checking that the value is a set."
ref: tlc2/value/impl/TupleValue.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_of_tuple ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(<<1>>)
====

(*--- recorded
all:
  exit: 0
---*)
