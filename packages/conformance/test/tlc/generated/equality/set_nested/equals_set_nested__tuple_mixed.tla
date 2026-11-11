(*---
description: Compares set_nested, a SetEnumValue, with tuple_mixed, a TupleValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_nested__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) = (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_nested__tuple_mixed failed.
    Attempted to check equality of the set {{}, {1}} with the value:
    <<1, "a", {TRUE}>>
---*)
