(*---
description: Evaluates a random function expression, seed 262, number 8280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 0>>"
---*)
