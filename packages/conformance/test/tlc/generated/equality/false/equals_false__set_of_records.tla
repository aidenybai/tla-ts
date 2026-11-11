(*---
description: Compares false, a BoolValue, with set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_false__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) = ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_false__set_of_records failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    {[a |-> 1], [a |-> 2]}
---*)
