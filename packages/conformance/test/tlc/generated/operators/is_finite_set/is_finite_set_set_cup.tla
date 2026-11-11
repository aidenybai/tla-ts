(*---
description: is_finite_set applied to set_cup, a SetCupValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
