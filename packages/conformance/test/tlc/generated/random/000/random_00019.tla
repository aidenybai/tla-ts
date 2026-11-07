(*---
description: Evaluates a random bool expression, seed 262, number 19.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Cardinality({b25 : b25 \in {2, 1, 3}}) < ((3 + 1) \div IF FALSE THEN 2147483647 ELSE 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
