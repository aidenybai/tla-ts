(*---
description: Evaluates a random int expression, seed 262, number 3019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 1)"
---*)
