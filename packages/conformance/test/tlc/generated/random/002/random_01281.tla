(*---
description: Evaluates a random seq expression, seed 262, number 1281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
