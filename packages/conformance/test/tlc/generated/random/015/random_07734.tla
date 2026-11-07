(*---
description: Evaluates a random record expression, seed 262, number 7734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(SortSeq(SubSeq(<<1>>, <<1, 2>>, 0), LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
