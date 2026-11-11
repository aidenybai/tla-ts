(*---
description: apply of tuple, a TupleValue, and int_zero, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>)[0])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple__int_zero failed.
    Attempted to access index 0 of tuple
    <<1, 2>>
    which is out of bounds.
---*)
