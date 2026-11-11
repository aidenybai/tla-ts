(*---
description: Evaluates a random int expression, seed 262, number 7342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 3, b |-> TRUE] EXCEPT !.a = Len(<<>>)]).a - (Cardinality(DOMAIN <<5, 6>>) \div ((1 * 3) + (7 * 3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
