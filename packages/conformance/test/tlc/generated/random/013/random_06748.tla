(*---
description: Evaluates a random set expression, seed 262, number 6748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE) \cap (((CHOOSE b10343 \in {x \in 1..3 : x > 1} : FALSE) .. (2147483647 % 0)) \cup ({b10344 \in {2, 1, 3} : TRUE} \cap (1..3 \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06748 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 61 of module random_06748
---*)
