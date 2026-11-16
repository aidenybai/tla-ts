(*---
description: Evaluates a random function expression, seed 262, number 9326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 1)"
---*)
