(*---
description: Evaluates a random function expression, seed 262, number 1368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2, 2>>"
---*)
