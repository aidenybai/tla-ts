(*---
description: Compares tuple_mixed, a TupleValue, with tuple_empty, a TupleValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_mixed__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) = (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
