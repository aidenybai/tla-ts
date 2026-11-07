(*---
description: Evaluates a random bool expression, seed 262, number 3701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [1..2 -> {}] : TRUE) * (-IF FALSE THEN 0 ELSE 0)) \in (({2147483647 : b5846 \in {1}} \ {0, 2}) .. IF ([a |-> 1] < 0) THEN (1 * 3) ELSE (0 + [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03701 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 50 of module random_03701
---*)
