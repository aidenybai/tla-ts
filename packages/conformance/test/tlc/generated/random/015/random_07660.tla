(*---
description: Evaluates a random seq expression, seed 262, number 7660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 2)"
---*)
