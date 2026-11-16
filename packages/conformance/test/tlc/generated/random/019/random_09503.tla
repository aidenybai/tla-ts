(*---
description: Evaluates a random int expression, seed 262, number 9503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)) * (Head([<<3, 1, 2>> EXCEPT ![1] = 2]) \div (Len(<<5, 6>>) % (3 % 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09503 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
