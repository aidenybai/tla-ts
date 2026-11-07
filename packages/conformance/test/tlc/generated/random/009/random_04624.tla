(*---
description: Evaluates a random bool expression, seed 262, number 4624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE r \in [a : {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
