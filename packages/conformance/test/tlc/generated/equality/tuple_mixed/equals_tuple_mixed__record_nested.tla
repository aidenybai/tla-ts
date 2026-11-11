(*---
description: Compares tuple_mixed, a TupleValue, with record_nested, a RecordValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_mixed__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) = ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
