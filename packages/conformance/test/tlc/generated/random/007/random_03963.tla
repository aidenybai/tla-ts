(*---
description: Evaluates a random bool expression, seed 262, number 3963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {}] : TRUE) = [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = Cardinality((1 :> 2))] EXCEPT !.a = LET b6236 == IF FALSE THEN 0 ELSE 3 IN LET b6237 == b6236 IN 1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03963 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_03963
---*)
