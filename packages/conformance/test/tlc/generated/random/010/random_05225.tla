(*---
description: Evaluates a random set expression, seed 262, number 5225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ([([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![(2 + 0)] = (0 * 7)] @@ (CHOOSE f \in [{} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
