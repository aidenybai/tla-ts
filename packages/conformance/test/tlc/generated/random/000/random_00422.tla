(*---
description: Evaluates a random seq expression, seed 262, number 422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SortSeq(SubSeq(<<1>>, 2147483647, 7), LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o SortSeq(<<(3 + -1), ([a |-> 1, b |-> TRUE] = [a |-> 1])>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00422 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    FALSE
---*)
