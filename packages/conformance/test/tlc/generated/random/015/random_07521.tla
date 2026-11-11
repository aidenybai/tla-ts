(*---
description: Evaluates a random seq expression, seed 262, number 7521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT ![1] = Head(Append(<<>>, 3))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
