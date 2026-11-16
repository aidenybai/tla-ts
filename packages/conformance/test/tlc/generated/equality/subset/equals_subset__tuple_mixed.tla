(*---
description: Compares subset, a SubsetValue, with tuple_mixed, a TupleValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_subset__tuple_mixed failed.
    Attempted to check equality of the set {{}, {1}, {2}, {1, 2}} with the value:
    <<1, "a", {TRUE}>>
---*)
