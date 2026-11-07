(*---
description: apply of tuple, a TupleValue, and tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>)[<<1, "a", {TRUE}>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple__tuple_mixed failed.
    Attempted to access tuple at a non integral index: <<1, "a", {TRUE}>>
---*)
