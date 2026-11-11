(*---
description: Evaluates a random record expression, seed 262, number 4106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
