(*---
description: Evaluates a random int expression, seed 262, number 1737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(2 + 3), Len(<<1>>)>>) + (([a |-> 7, b |-> TRUE]).a + ((1 + -1) * Cardinality({1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 9"
---*)
