(*---
description: Evaluates a random int expression, seed 262, number 6525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10023 \in (({b10024 \in {2, 1, 3} : TRUE} \cap {1, 1}) \cap {(1 - 2147483647), CASE TRUE -> 3 [] OTHER -> 2147483647}) : (Head([<<1, 2>> EXCEPT ![1] = 2147483647]) \in {b10025 \in {1 : b10026 \in {1, 2}} : (TRUE => TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06525 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 246 of module random_06525
---*)
