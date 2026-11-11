(*---
description: Compares int_negative, a IntValue, with tuple_mixed, a TupleValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_negative__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) = (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_negative__tuple_mixed failed.
    Attempted to check equality of integer -3 with non-integer:
    <<1, "a", {TRUE}>>
---*)
