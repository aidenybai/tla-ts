(*---
description: Compares record_nested, a RecordValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record_nested__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_record_nested__double_at failed.
    Attempted to check equality of record:
    [a |-> [b |-> <<1>>]]
    with non-record
    <<2, 3>>
---*)
