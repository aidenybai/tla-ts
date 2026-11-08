(*---
description: Evaluates a random function expression, seed 262, number 8390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SortSeq(SubSeq(<<3, 1, 2>>, -1, 2147483647), LAMBDA p, q : p < q), LAMBDA p, q : p < q) \/ (([a |-> 3, b |-> FALSE]).a < LET b12979 == (CHOOSE b12980 \in 2..1 : FALSE) IN ([x \in Nat |-> x + 1])[1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08390 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
