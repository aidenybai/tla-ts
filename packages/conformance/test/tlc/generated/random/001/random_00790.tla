(*---
description: Evaluates a random set expression, seed 262, number 790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE) @@ (CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
