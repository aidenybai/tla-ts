(*---
description: Evaluates a random seq expression, seed 262, number 649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-1 + -1)], LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
