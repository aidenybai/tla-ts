(*---
description: Evaluates a random int expression, seed 262, number 6054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([SortSeq(7, LAMBDA p, q : p < q) EXCEPT ![1] = (3 \div 3)]) - Cardinality(((7 .. 2147483647) \ [b9328 \in 1..3 |-> 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06054 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    7
---*)
