(*---
description: Evaluates a random set expression, seed 262, number 5279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((CHOOSE f \in [{} -> {1, 2}] : TRUE) @@ [b8172 \in {x \in 1..3 : x > 1} |-> 2147483647]) @@ (CHOOSE f \in [{} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
