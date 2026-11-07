(*---
description: Evaluates a random int expression, seed 262, number 6291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [1..2 -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
