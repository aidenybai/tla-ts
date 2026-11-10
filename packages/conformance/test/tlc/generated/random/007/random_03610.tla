(*---
description: Evaluates a random function expression, seed 262, number 3610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 0>>"
---*)
