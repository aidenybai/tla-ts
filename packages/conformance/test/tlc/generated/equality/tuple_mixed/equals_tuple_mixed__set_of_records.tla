(*---
description: Compares tuple_mixed, a TupleValue, with set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_mixed__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) = ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_tuple_mixed__set_of_records failed.
    Attempted to check equality of the function <<1, "a", {TRUE}>> with the value:
    {[a |-> 1], [a |-> 2]}
---*)
