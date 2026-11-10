(*---
description: Compares record, a RecordValue, with int_zero, a IntValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) = (0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_record__int_zero failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> 2]
    with non-record
    0
---*)
