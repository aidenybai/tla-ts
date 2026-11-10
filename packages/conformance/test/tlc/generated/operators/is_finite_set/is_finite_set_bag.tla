(*---
description: is_finite_set applied to bag, a FcnRcdValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
