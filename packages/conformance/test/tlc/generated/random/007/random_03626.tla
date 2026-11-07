(*---
description: Evaluates a random int expression, seed 262, number 3626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5729 \in DOMAIN (([x \in 1..2 |-> x] @@ (1 :> 2)) @@ (CHOOSE f \in [{1} -> {}] : TRUE)) : (({2 : b5730 \in {}} = ({2, 1, 3} \cup 2..1)) /\ ((~FALSE) <=> (\A b5731 \in 2..1 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03626 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 109 of module random_03626
---*)
