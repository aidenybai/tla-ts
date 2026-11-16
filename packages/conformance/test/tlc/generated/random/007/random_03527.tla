(*---
description: Evaluates a random function expression, seed 262, number 3527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b5572 \in {(CHOOSE b5574 \in {} : FALSE) : b5573 \in DOMAIN (1 :> 2)} |-> ((CHOOSE b5575 \in 2..1 : TRUE) % (-2))] @@ ((CHOOSE f \in [2..1 -> {}] : TRUE) @@ [b5576 \in {2 : b5577 \in Nat} |-> Cardinality({x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03527 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 56 of module random_03527
---*)
