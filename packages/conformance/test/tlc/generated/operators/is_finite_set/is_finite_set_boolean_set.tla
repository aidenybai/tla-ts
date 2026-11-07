(*---
description: is_finite_set applied to boolean_set, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
