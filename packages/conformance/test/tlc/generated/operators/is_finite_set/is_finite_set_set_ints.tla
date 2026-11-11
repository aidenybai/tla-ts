(*---
description: is_finite_set applied to set_ints, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
