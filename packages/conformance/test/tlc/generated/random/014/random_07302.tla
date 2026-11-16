(*---
description: Evaluates a random function expression, seed 262, number 7302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-IF ([a |-> 1] = [a |-> 1]) THEN IF TRUE THEN 3 ELSE -1 ELSE ({1, 2} = SUBSET {1})) :> Head((SortSeq(FALSE, LAMBDA p, q : p < q) \o [<<3, 1, 2>> EXCEPT ![1] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07302 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    FALSE
---*)
