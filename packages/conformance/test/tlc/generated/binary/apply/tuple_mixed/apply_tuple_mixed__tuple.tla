(*---
description: apply of tuple_mixed, a TupleValue, and tuple, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple_mixed__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>)[<<1, 2>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple_mixed__tuple failed.
    Attempted to access tuple at a non integral index: <<1, 2>>
---*)
