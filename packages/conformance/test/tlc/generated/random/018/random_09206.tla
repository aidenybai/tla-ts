(*---
description: Evaluates a random bool expression, seed 262, number 9206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = (3 + -1)] EXCEPT !.a = (-(-1))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
