(*---
description: Evaluates a random function expression, seed 262, number 3295.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03295 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
