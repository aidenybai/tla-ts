(*---
description: apply of tuple, a TupleValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>)[[x \in Nat |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple__function_lazy failed.
    Attempted to access tuple at a non integral index: [x \in Nat |-> <expression line 14, col 42 to line 14, col 42 of module apply_tuple__function_lazy>]
---*)
