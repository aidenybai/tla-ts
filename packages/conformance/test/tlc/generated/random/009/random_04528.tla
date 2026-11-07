(*---
description: Evaluates a random seq expression, seed 262, number 4528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq(<<3, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = ((-1 - 2147483647) * (2147483647 % 2147483647))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3>>"
---*)
