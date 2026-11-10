(*---
description: Evaluates a random function expression, seed 262, number 3461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a :> ((2 + 1) \div [a |-> 1, b |-> TRUE])) EXCEPT ![(((<<5, 6>>)[2] * (1 * 1)) + IF (~TRUE) THEN (2147483647 * 1) ELSE (CHOOSE b5477 \in Nat : FALSE))] = (-LET b5478 == ({1} - 2) IN (CHOOSE f \in [2..1 -> {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03461 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
