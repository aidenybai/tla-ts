(*---
description: Evaluates a random record expression, seed 262, number 5130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
