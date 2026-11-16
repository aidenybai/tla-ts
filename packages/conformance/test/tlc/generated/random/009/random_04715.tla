(*---
description: Evaluates a random set expression, seed 262, number 4715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
