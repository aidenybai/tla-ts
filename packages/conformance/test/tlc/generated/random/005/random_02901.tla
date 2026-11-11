(*---
description: Evaluates a random seq expression, seed 262, number 2901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
