(*---
description: Compares record_nested, a RecordValue, with subset, a SubsetValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) = (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_record_nested__subset failed.
    Attempted to check equality of record:
    [a |-> [b |-> <<1>>]]
    with non-record
    {{}, {1}, {2}, {1, 2}}
---*)
