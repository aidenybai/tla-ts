(*---
description: Evaluates a random function expression, seed 262, number 8762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13568 \in ({3, -1} \ DOMAIN (1 :> 2)) |-> Cardinality({b13569 \in 2..1 : TRUE})] @@ (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08762 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 104 to line 14, col 143 of module random_08762
---*)
