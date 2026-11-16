(*---
description: Evaluates a random record expression, seed 262, number 8934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = LET b13857 == -1 IN 1] EXCEPT !.a = Cardinality({b13858 \in {} : TRUE})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
