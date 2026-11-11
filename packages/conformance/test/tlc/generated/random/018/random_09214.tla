(*---
description: Evaluates a random function expression, seed 262, number 9214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head([{x \in 1..3 : x > 1} EXCEPT ![1] = 7]) :> (CHOOSE b14302 \in UNION {{x \in 1..3 : x > 1}, 1..3} : (b14302 = -1))) @@ (CHOOSE f \in [{} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09214 failed.
    Attempted to apply EXCEPT construct to the value {2, 3}.
---*)
