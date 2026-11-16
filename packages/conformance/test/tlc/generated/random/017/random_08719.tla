(*---
description: Evaluates a random set expression, seed 262, number 8719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b13502 \in {b13503 \in UNION {{1, 2}, {2, 1, 3}} : ([a |-> 1, b |-> TRUE] = [a |-> 1])} |-> ((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))[(CHOOSE b13504 \in {} : 3)]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
