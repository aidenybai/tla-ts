(*---
description: Evaluates a random function expression, seed 262, number 3145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE) @@ [b5022 \in {(CHOOSE b5024 \in 2..1 : TRUE) : b5023 \in {2, 2}} |-> (Cardinality({}) + Cardinality({2, 1, 3}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03145 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 86 to line 14, col 113 of module random_03145
---*)
