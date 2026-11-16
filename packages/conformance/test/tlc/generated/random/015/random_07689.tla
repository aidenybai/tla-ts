(*---
description: Evaluates a random bool expression, seed 262, number 7689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07689 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))
    line 14, col 17 to line 14, col 63 of module random_07689
---*)
