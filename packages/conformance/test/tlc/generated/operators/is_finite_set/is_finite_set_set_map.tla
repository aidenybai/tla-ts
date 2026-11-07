(*---
description: is_finite_set applied to set_map, a SetEnumValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
