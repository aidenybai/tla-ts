(*---
description: Evaluates a random int expression, seed 262, number 2841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((Len(SortSeq([x \in 1..2 |-> x], LAMBDA p, q : p < q)) .. ([a |-> 3, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
