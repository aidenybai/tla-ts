(*---
description: Evaluates a random seq expression, seed 262, number 9122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([Tail(<<1, 2>>) EXCEPT ![1] = (-2147483647)], LAMBDA p, q : p < q) \o SelectSeq([Tail(<<>>) EXCEPT ![1] = SortSeq(<<1, 2>>, LAMBDA p, q : p < q)], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09122 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
