(*---
description: Evaluates a random bool expression, seed 262, number 5628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((({2, 1, 3} \cup {1}) \cup ({x \in 1..3 : x > 1} \cap Nat)) \ DOMAIN (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
