(*---
description: Evaluates a random int expression, seed 262, number 2829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4496 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a IN IF ([a |-> 1] = [a |-> 1]) THEN (0 + 2) ELSE LET b4497 == -1 IN b4497 - ([b4498 \in {2, 2147483647} |-> Len(<<3, 1, 2>>)])[((3 + 1) \div Cardinality({}))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
