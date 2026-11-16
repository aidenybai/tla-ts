(*---
description: Evaluates a random int expression, seed 262, number 5779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (-2), b |-> (TRUE => FALSE)] EXCEPT !.a = ((3 \div 7) * Cardinality({1}))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
