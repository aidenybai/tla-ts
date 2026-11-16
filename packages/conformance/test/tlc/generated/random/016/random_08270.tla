(*---
description: Evaluates a random function expression, seed 262, number 8270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b12804 \in {b12805 \in {} : TRUE} : (FALSE /\ FALSE)) - Cardinality({1 : b12806 \in SUBSET {1}})) :> ((\E b12807 \in {3, 0} : (1 = -1)) - (-Cardinality(7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08270 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 77 of module random_08270
---*)
