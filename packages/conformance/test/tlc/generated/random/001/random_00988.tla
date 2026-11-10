(*---
description: Evaluates a random set expression, seed 262, number 988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((({2, 1, 3} \cap SUBSET {1}) \cap DOMAIN <<5, 6>>)) : b1585 \in {b1586 \in {(-2147483647), (CHOOSE b1587 \in {x \in 1..3 : x > 1} : FALSE)} : (((1 :> 2) = [a |-> 1]) \/ (2..1 = {1, 2}))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00988 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 121 to line 14, col 165 of module random_00988
---*)
