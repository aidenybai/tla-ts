(*---
description: Evaluates a random seq expression, seed 262, number 3663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(Append((<<3, 1, 2>> \o <<3, 1, 2>>), Head(<<1, 2>>)), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1, 2, 2, 3, 3>>"
---*)
