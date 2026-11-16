(*---
description: Evaluates a random function expression, seed 262, number 5281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8176 \in (({2, {2, 1, 3}} \cap (2..1 \cap {1})) \cup ((2..1 \cup 1..3) \ {b8177 \in {1, 2} : TRUE})) |-> (-LET b8178 == (2 - b8176) IN (CHOOSE b8179 \in 2..1 : [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05281 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 154 to line 14, col 195 of module random_05281
---*)
