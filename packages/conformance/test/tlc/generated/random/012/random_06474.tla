(*---
description: Evaluates a random int expression, seed 262, number 6474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE))[((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
