(*---
description: apply of tuple_empty, a TupleValue, and int_maximum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple_empty__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>)[2147483647])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple_empty__int_maximum failed.
    Attempted to access index 2147483647 of tuple
    <<>>
    which is out of bounds.
---*)
