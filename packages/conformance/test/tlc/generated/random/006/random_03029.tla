(*---
description: Evaluates a random seq expression, seed 262, number 3029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<Head(SubSeq(<<3, 1, 2>>, <<3, 1, 2>>, 3)), (\E b4814 \in ({1} \cap {1, 2}) : (\E b4815 \in 1..3 : TRUE))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03029 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<3, 1, 2>>
---*)
