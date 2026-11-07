(*---
description: Evaluates a random bool expression, seed 262, number 7868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq([SubSeq(2, 7, -1) EXCEPT ![1] = Head(<<1, 2>>)], LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    2
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    2
---*)
