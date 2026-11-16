(*---
description: Evaluates a random int expression, seed 262, number 8904.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08904 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(DOMAIN ((CHOOSE f \in [{1} -> {1}] : TRUE) @@ [<<5, 6>> EXCEPT ![1] = 2147483647])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
