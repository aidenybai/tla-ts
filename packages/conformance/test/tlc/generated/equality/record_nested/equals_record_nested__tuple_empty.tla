(*---
description: Compares record_nested, a RecordValue, with tuple_empty, a TupleValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record_nested__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) = (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
