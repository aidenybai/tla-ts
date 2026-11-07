(*---
description: Evaluates a random bool expression, seed 262, number 7875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq([a |-> (1 - -1), b |-> (TRUE \/ TRUE)], LAMBDA e : e > 0) \o [SelectSeq(SortSeq(FALSE, LAMBDA p, q : p < q), LAMBDA e : e > 0) EXCEPT ![1] = (LET b12159 == 2147483647 IN b12159 * (0 % 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 2, b |-> TRUE]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
