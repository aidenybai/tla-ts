(*---
description: is_finite_set applied to tuple_mixed, a TupleValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
