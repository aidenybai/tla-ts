(*---
description: Evaluates a random bool expression, seed 262, number 7842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {2, 1, 3}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
