(*---
description: Evaluates a random int expression, seed 262, number 2805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4449 == (-([a |-> 1]).a) IN (CHOOSE b4450 \in {0 : b4451 \in 2..1} : (\A b4452 \in 1..3 : TRUE)) % IF ([2147483647 EXCEPT !.a = 7] = (\A b4453 \in {1} : FALSE)) THEN (Cardinality({x \in 1..3 : x > 1}) + Head(<<>>)) ELSE ([b4454 \in 1..3 |-> b4454])[(2 % 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02805 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 51 to line 14, col 116 of module random_02805
---*)
