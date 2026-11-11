(*---
description: Evaluates a random int expression, seed 262, number 9384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(SubSeq(<<-1, 7>>, Len(<<1>>), (0 - 1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
