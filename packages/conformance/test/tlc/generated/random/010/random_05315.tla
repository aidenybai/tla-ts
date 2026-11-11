(*---
description: Evaluates a random int expression, seed 262, number 5315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
