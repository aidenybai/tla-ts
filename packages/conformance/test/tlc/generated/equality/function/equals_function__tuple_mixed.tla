(*---
description: Compares function, a FcnRcdValue, with tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) = (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
