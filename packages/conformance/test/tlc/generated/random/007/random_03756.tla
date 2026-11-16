(*---
description: Evaluates a random int expression, seed 262, number 3756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> LET b5923 == 2 IN <<3, 1, 2>>, b |-> (\E b5924 \in SUBSET {1} : TRUE)] EXCEPT !.a = Cardinality({0, 2})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
