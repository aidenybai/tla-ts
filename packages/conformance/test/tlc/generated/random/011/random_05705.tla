(*---
description: Evaluates a random int expression, seed 262, number 5705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
