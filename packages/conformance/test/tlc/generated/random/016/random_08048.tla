(*---
description: Evaluates a random int expression, seed 262, number 8048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (-1 + 1), b |-> (TRUE /\ TRUE)]).a - Head(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
