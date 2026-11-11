(*---
description: Compares set_filter, a SetPredValue, with set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetPredValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_filter__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) = ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_filter__set_of_records failed.
    Attempted to check equality of integer 2 with non-integer:
    [a |-> 1]
---*)
