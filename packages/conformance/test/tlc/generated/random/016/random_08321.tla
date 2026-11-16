(*---
description: Evaluates a random bool expression, seed 262, number 8321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = Cardinality({1})] EXCEPT !.a = @ + (CHOOSE b12874 \in {3, 0} : (2147483647 < b12874))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08321 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 90 of module random_08321
---*)
