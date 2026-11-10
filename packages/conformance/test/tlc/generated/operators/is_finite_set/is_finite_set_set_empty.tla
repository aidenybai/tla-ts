(*---
description: is_finite_set applied to set_empty, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
