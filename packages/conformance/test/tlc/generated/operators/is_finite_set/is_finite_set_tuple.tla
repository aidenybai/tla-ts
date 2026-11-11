(*---
description: is_finite_set applied to tuple, a TupleValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
