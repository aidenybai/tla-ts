(*---
description: Compares tuple, a TupleValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
