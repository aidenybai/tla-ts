(*---
description: Evaluates a random int expression, seed 262, number 191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))[((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[Cardinality({b310 \in 1..3 : FALSE})]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
