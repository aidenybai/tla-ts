(*---
description: Evaluates a random record expression, seed 262, number 253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
