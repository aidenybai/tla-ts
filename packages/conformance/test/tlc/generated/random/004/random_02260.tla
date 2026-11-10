(*---
description: Evaluates a random record expression, seed 262, number 2260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF (3 = 1) THEN (CHOOSE b3562 \in 3 : TRUE) ELSE IF FALSE THEN -1 ELSE 1 \in DOMAIN (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)), b |-> (LET b3563 == ([a |-> 1, b |-> TRUE]).a IN IF TRUE THEN b3563 ELSE b3563 < (-Cardinality({2, 1, 3})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> FALSE, b |-> 1]"
---*)
