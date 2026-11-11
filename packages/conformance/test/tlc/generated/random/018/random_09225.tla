(*---
description: Evaluates a random seq expression, seed 262, number 9225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq([Tail(<<3, 1, 2>>) EXCEPT ![1] = LET b14318 == 1 IN 1], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
