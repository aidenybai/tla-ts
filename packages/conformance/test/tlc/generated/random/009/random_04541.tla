(*---
description: Evaluates a random bool expression, seed 262, number 4541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) = [[a |-> ([a |-> 1]).a, b |-> (\E b7123 \in 1..3 : TRUE)] EXCEPT !.a = (-IF TRUE THEN -1 ELSE 2)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
