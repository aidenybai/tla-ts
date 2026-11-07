(*---
description: Evaluates a random int expression, seed 262, number 2202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
