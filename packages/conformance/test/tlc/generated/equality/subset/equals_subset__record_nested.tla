(*---
description: Compares subset, a SubsetValue, with record_nested, a RecordValue.
ref: tlc2/value/impl/SubsetValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_subset__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) = ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_subset__record_nested failed.
    Attempted to check equality of the set {{}, {1}, {2}, {1, 2}} with the value:
    [a |-> [b |-> <<1>>]]
---*)
