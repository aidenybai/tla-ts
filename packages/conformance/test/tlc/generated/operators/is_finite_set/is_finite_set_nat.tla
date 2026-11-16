(*---
description: is_finite_set applied to nat, a UserValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
