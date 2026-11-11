(*---
description: Compares double_at, a FcnRcdValue, with tuple_empty, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_double_at__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) = (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
