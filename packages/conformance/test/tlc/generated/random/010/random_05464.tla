(*---
description: Evaluates a random int expression, seed 262, number 5464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q), Head(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05464 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
