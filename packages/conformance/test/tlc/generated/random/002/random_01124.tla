(*---
description: Evaluates a random seq expression, seed 262, number 1124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(DOMAIN (-1 :> 2)), (CHOOSE b1799 \in ({b1800 \in {x \in 1..3 : x > 1} : FALSE} \ {0, 2}) : ([[a |-> 1] EXCEPT !.a = @ + 0] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b1799]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01124 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 50 to line 14, col 201 of module random_01124
---*)
