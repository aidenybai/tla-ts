(*---
description: Evaluates a random seq expression, seed 262, number 3474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0>>"
---*)
