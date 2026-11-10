(*---
description: Evaluates a random seq expression, seed 262, number 104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(SortSeq(2, LAMBDA p, q : p < q), (2147483647 - 2147483647))) \o Tail(SortSeq(SubSeq(<<>>, 1, 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00104 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    2
---*)
