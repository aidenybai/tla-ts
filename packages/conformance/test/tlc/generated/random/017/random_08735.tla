(*---
description: Evaluates a random int expression, seed 262, number 8735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SelectSeq(Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), Len(<<>>)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
