(*---
description: Evaluates a random set expression, seed 262, number 66.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((CHOOSE f \in [1..2 -> {1}] : TRUE) @@ (([x \in 1..2 |-> x])[1] :> (0 % 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
