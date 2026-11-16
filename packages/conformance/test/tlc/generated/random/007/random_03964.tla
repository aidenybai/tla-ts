(*---
description: Evaluates a random set expression, seed 262, number 3964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((CHOOSE b6238 \in {1, 2} : FALSE) :> LET b6239 == 0 IN 2) @@ (LET b6240 == 3 IN 1 :> Cardinality(SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03964 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 56 of module random_03964
---*)
