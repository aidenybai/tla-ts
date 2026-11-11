(*---
description: Evaluates a random bool expression, seed 262, number 7323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((2147483647 .. 7) \cap (Nat \cap {1, 2})), DOMAIN [b11268 \in {x \in 1..3 : x > 1} |-> 7]} \subseteq (DOMAIN [<<5, 6>> EXCEPT ![1] = 1] \cap {(7 - 3), (CHOOSE b11269 \in 2..1 : FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07323 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 177 to line 14, col 206 of module random_07323
---*)
