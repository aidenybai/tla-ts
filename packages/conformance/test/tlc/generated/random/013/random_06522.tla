(*---
description: Evaluates a random set expression, seed 262, number 6522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((Append(<<>>, 1) \o SortSeq({2, 1, 3}, LAMBDA p, q : p < q))), (((1 \div 7) + ((1 :> 2))[1]) % LET b10022 == (0 + -1) IN (b10022 % 2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2, 3}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2, 3}
---*)
