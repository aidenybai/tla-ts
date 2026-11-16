(*---
description: Evaluates a random bool expression, seed 262, number 7529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11602 == ([x \in 1..2 |-> x])[2] IN Head(<<1>>) \in {(CHOOSE b11603 \in {} : TRUE), (CHOOSE b11604 \in Nat : FALSE)}) \/ (\A b11605 \in (Cardinality({1}) \ DOMAIN (1 :> 2)) : ((<<3, 1, 2>> < b11605) \/ (3 \in {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07529 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 103 of module random_07529
---*)
