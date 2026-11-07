(*---
description: Evaluates a random set expression, seed 262, number 4685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7323 \in ({1} \cap {x \in 1..3 : x > 1}) : (b7323 < 1)) + ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a) .. (((-1 + 7) * (TRUE).a) * LET b7324 == (2 * 1) IN ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04685 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 80 of module random_04685
---*)
