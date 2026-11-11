(*---
description: is_finite_set applied to set_cap, a SetCapValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
