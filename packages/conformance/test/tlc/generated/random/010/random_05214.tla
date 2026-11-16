(*---
description: Evaluates a random function expression, seed 262, number 5214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE) @@ (CHOOSE f \in [{} -> {1, 2}] : TRUE)) @@ (((0 * 7) + CASE FALSE -> 2147483647 [] OTHER -> 7) :> (CHOOSE b8089 \in UNION {{2, 1, 3}, {1}} : (-1 = 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05214 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 165 to line 14, col 214 of module random_05214
---*)
