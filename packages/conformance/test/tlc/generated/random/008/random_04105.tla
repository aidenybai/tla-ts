(*---
description: Evaluates a random record expression, seed 262, number 4105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Tail(<<-1, -1>>)), b |-> (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) < (LET b6451 == 2 IN b6451 * (2 % 2147483647)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
