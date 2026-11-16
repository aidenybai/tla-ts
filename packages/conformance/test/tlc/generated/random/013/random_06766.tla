(*---
description: Evaluates a random function expression, seed 262, number 6766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE) @@ ((CHOOSE b10374 \in {7, 7} : (TRUE \/ TRUE)) :> ([0 EXCEPT ![0] = 2147483647]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06766 failed.
    Attempted to apply EXCEPT construct to the value 0.
---*)
