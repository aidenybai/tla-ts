(*---
description: Evaluates a random function expression, seed 262, number 3189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [{} -> {}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
