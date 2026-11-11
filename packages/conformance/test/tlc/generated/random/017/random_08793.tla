(*---
description: Evaluates a random record expression, seed 262, number 8793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((0 - 3) + (-1 + 7)), b |-> (CHOOSE r \in [a : {2, 1, 3}] : TRUE)]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
