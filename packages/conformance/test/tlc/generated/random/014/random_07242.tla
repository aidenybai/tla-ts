(*---
description: Evaluates a random set expression, seed 262, number 7242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ([b11133 \in 2..1 |-> 7] @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE)) \ UNION {{b11134 \in {b11135 \in {2, 1, 3} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1])}, {b11136 \in {-1, 0} : ([a |-> 1] = [a |-> 1, b |-> TRUE])}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
