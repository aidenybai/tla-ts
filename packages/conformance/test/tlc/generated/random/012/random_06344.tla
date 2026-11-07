(*---
description: Evaluates a random int expression, seed 262, number 6344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq(Tail([<<3, 1, 2>> EXCEPT ![1] = 7]), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
