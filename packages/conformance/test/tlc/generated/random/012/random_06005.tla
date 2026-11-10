(*---
description: Evaluates a random bool expression, seed 262, number 6005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(7 % 7), (1 \div 7)} = {(3 + 7), ([a |-> 1]).a}) /\ ((Cardinality({x \in 1..3 : x > 1}) + Len(<<>>)) < ((-1 \div 2147483647) \div Len(<<>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
