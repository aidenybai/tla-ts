(*---
description: Evaluates a random bool expression, seed 262, number 619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1..3 \cup 2..1) \cup ({2, 1, 3} \ {1})) \cap ((-1 * 2) .. LET b1040 == 7 IN 2147483647)) \subseteq (CHOOSE r \in [a : {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00619 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 120 to line 14, col 147 of module random_00619
---*)
