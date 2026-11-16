(*---
description: Evaluates a random record expression, seed 262, number 1227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b1975 \in (-1 .. -1) : (~TRUE)) - Cardinality(UNION {{2, 1, 3}, {1}})), b |-> (((CHOOSE b1976 \in 1..3 : TRUE) + (0 % 2147483647)) \in (({1} \ {2, 1, 3}) \cap ({2, 1, 3} \ Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01227 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 61 of module random_01227
---*)
