(*---
description: Evaluates a random function expression, seed 262, number 8293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {}] : TRUE) @@ (CHOOSE f \in [{} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
