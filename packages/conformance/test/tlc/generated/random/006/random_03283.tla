(*---
description: Evaluates a random seq expression, seed 262, number 3283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([Tail(SortSeq(3, LAMBDA p, q : p < q)) EXCEPT ![1] = ((CHOOSE r \in [a : {1, 2}] : TRUE)).a], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03283 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    3
---*)
