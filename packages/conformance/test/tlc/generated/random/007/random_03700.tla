(*---
description: Evaluates a random record expression, seed 262, number 3700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {2, 1, 3}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
