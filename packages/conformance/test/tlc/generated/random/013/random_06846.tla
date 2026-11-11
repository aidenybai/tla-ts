(*---
description: Evaluates a random set expression, seed 262, number 6846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN (1 :> 2) \cap {b10494 : b10494 \in {2, 1, 3}}) \cap ({b10495 \in {} : TRUE} \ {2 : b10496 \in 2..1})) \ ({(CHOOSE b10497 \in {} : FALSE), ((1 :> 2))[2147483647]} \ {(CHOOSE b10499 \in {1, 2} : FALSE) : b10498 \in (Nat \ {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06846 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 160 of module random_06846
---*)
