(*---
description: Evaluates a random set expression, seed 262, number 690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([a |-> -1, b |-> FALSE]).a : b1155 \in {(0 - 2), (7 - 7)}} \cap {(Cardinality({1, 2}) - (2 + 0)) : b1156 \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
