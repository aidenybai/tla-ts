(*---
description: Evaluates a random seq expression, seed 262, number 9932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<1, 2>>)], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
