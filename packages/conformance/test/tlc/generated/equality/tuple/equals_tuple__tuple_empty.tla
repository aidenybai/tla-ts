(*---
description: Compares tuple, a TupleValue, with tuple_empty, a TupleValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) = (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
