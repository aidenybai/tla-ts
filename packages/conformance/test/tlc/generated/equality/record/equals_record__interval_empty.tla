(*---
description: Compares record, a RecordValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) = (3..1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_record__interval_empty failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> 2]
    with non-record
    {}
---*)
