(*---
description: Evaluates a random int expression, seed 262, number 6738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b10324 == (2 % FALSE) IN ([x \in 1..2 |-> x])[1] - Cardinality(({} \cap {2, 1, 3}))) \div Len(Tail(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
