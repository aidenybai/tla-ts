(*---
description: Compares tuple_mixed, a TupleValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_mixed__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) = (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
