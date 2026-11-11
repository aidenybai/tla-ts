(*---
description: Evaluates a random int expression, seed 262, number 6880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = Len(<<>>)]).a + (((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))[([a |-> 1]).a] - Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
