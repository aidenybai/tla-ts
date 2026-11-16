(*---
description: Evaluates a random seq expression, seed 262, number 7385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq([[a |-> -1, b |-> TRUE] EXCEPT !.a = IF TRUE THEN -1 ELSE 0], LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07385 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> -1, b |-> TRUE]
---*)
