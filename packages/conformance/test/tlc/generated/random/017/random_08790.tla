(*---
description: Evaluates a random int expression, seed 262, number 8790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(DOMAIN (CHOOSE f \in [2..1 -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
