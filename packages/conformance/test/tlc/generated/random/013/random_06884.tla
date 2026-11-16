(*---
description: Evaluates a random function expression, seed 262, number 6884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0, 1}"
---*)
