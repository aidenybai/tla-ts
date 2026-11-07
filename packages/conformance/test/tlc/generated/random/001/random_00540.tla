(*---
description: Evaluates a random int expression, seed 262, number 540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b915 \in {(Cardinality({1, 2}) - Cardinality(SUBSET {1})) : b916 \in {(-3), LET b917 == 2 IN -1}} : (~(\E b918 \in {b915, 3} : (\A b919 \in {} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00540 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 176 of module random_00540
---*)
