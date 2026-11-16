(*---
description: Evaluates a random int expression, seed 262, number 1691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b2700 == Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) IN Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) \div Cardinality({IF FALSE THEN 2 ELSE 7, (3 * 7)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
