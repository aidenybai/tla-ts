(*---
description: Evaluates a random seq expression, seed 262, number 5264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SortSeq(Tail(<<>>), LAMBDA p, q : p < q)), Len([Tail(<<3, 1, 2>>) EXCEPT ![1] = Cardinality({})])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05264 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
