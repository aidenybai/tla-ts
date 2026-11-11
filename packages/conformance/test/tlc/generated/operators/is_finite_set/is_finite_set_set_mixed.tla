(*---
description: is_finite_set applied to set_mixed, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
