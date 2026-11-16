(*---
description: is_finite_set applied to int, a UserValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
