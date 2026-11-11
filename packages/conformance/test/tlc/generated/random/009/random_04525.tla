(*---
description: Evaluates a random function expression, seed 262, number 4525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [1..2 -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04525 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 66 to line 14, col 97 of module random_04525
---*)
