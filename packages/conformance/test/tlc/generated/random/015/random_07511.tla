(*---
description: Evaluates a random int expression, seed 262, number 7511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(Tail(SelectSeq(<<5, 6>>, LAMBDA e : e > 0)), Len(SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
