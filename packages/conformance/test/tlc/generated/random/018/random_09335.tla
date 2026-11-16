(*---
description: Evaluates a random set expression, seed 262, number 9335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({x \in 1..3 : x > 1} \cap {1, 2}) \cap (2..1 \cap {2, 1, 3})) \cup ({7, 0} \ (Nat \cap {}))), DOMAIN (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0, 7}"
---*)
