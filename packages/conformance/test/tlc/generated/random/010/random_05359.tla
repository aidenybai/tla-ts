(*---
description: Evaluates a random record expression, seed 262, number 5359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-2147483647)]) = CASE (\E b8287 \in {2147483647, 0} : (~FALSE)) -> IF (TRUE => FALSE) THEN (CHOOSE b8288 \in {2, 1, 3} : FALSE) ELSE [a |-> 7, b |-> TRUE] [] OTHER -> Cardinality((1..3 \cap {x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 56 of module random_05359
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05359 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
