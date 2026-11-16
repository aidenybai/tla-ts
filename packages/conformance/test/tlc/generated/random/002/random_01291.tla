(*---
description: Evaluates a random int expression, seed 262, number 1291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2056 == (IF {2, 1} THEN Head(<<1, 2>>) ELSE (7 - 2) \div Head(DOMAIN <<5, 6>>)) IN Cardinality({(b2057 * 1) : b2057 \in {b2058 \in 1..3 : FALSE}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
